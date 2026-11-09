import { createHash } from 'crypto';
import { CrmPhoneNumbersService } from '../crm-phone-numbers.service';

const actor = {
  workspaceId: 'workspace-a',
  userId: 'user-a',
  userWorkspaceId: 'membership-a',
};
const phone = '+12125550123';
const orderId = '02b64f79-29cc-4bdc-9956-c2839f178ee1';
const setup = () => {
  const documents = new Map<string, unknown>();
  const storage = {
    findOne: jest
      .fn()
      .mockImplementation(async ({ where }) =>
        documents.has(where.key) ? { value: documents.get(where.key) } : null,
      ),
    upsert: jest.fn().mockImplementation(async ({ key, value }) => {
      documents.set(key, value);
    }),
    manager: {
      transaction: jest.fn().mockImplementation(async (work) =>
        work({
          query: jest.fn(),
          getRepository: (entity: { name: string }) =>
            entity.name === 'UserWorkspaceEntity' ? memberships : storage,
        }),
      ),
    },
  };
  const memberships = {
    findOneBy: jest.fn().mockResolvedValue({ id: actor.userWorkspaceId }),
  };
  const values: Record<string, string> = {
    BILLING_STRIPE_API_KEY: 'sk_test_fake_not_a_real_key',
    SERVER_URL: 'https://crm.example.com',
    APP_SECRET: 'test-app-key',
  };
  const config = { get: (name: string) => values[name] };
  const plivo = {
    getVoiceSetup: jest.fn().mockResolvedValue({
      applicationId: 'crm-app',
      endpointUsername: 'crm-browser',
    }),
    hasCredentials: () => true,
    plivoRequest: jest.fn().mockRejectedValue({ status: 404 }),
    buildAnswerXml: (to?: string, caller?: string, record?: boolean) =>
      caller && to ? `dial:${caller}:${to}:${Boolean(record)}` : 'reject',
  };
  const permissions = {
    userHasWorkspaceSettingPermission: jest.fn().mockResolvedValue(true),
  };
  const service = new CrmPhoneNumbersService(
    storage as never,
    memberships as never,
    config as never,
    plivo as never,
    permissions as never,
  );
  const stripe = {
    checkout: {
      sessions: {
        retrieve: jest.fn().mockResolvedValue({
          id: 'cs_owned',
          livemode: true,
          client_reference_id: orderId,
          mode: 'subscription',
          subscription: 'sub_owned',
          payment_status: 'paid',
        }),
        create: jest.fn().mockResolvedValue({
          id: 'cs_owned',
          livemode: true,
          url: 'https://checkout.stripe.com/pay/owned',
        }),
      },
    },
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'sub_owned',
        customer: 'cus_owned',
        status: 'active',
        items: {
          data: [
            {
              quantity: 1,
              price: {
                unit_amount: 350,
                currency: 'usd',
                recurring: { interval: 'month' },
              },
            },
          ],
        },
      }),
    },
  };
  jest
    .spyOn(service as unknown as { stripe: () => unknown }, 'stripe')
    .mockReturnValue(stripe);
  const addOrder = (extras = {}) =>
    documents.set(`crm-phone-order:v1:${orderId}`, {
      ...actor,
      number: phone,
      sessionId: 'cs_owned',
      status: 'awaiting_payment',
      createdAt: new Date().toISOString(),
      ...extras,
    });
  const addNumber = (workspaceId = actor.workspaceId, active = true) =>
    documents.set(`crm-phone-number:v1:${phone}`, {
      workspaceId,
      orderId,
      number: phone,
      active,
    });
  return {
    service,
    storage,
    documents,
    memberships,
    stripe,
    plivo,
    permissions,
    addOrder,
    addNumber,
  };
};

describe('workspace-owned CRM phone numbers', () => {
  it('rejects another workspace’s number', async () => {
    const context = setup();
    context.addNumber('workspace-b');
    await expect(
      context.service.owned(actor.workspaceId, phone),
    ).rejects.toThrow('not purchased');
  });
  it('does not authorize an unpaid or suspended number', async () => {
    const context = setup();
    context.addNumber(actor.workspaceId, false);
    await expect(
      context.service.owned(actor.workspaceId, phone),
    ).rejects.toThrow();
  });
  it('binds a call to the workspace, number, destination and recording choice', async () => {
    const context = setup();
    context.addNumber();
    jest
      .spyOn(context.service, 'list')
      .mockResolvedValue([{ number: phone, label: 'CRM number' }]);
    const { token } = await context.service.callGrant(
      actor,
      '+14155550199',
      phone,
      true,
    );
    await expect(
      context.service.answer(
        token,
        'sip:+14155550199@phone.plivo.com',
        'call-a',
      ),
    ).resolves.toBe(`dial:${phone}:+14155550199:true`);
    await expect(
      context.service.answer(token, '+14155550199', 'call-b'),
    ).resolves.toBe('reject');
    await expect(
      context.service.answer(token, '+14155550200', 'call-a'),
    ).resolves.toBe('reject');
  });
  it('rejects the old unscoped calling path without a grant', async () => {
    const context = setup();
    await expect(
      context.service.answer(undefined, '+14155550199', 'legacy-call'),
    ).resolves.toBe('reject');
  });
  it('rechecks membership and number entitlement at call delivery', async () => {
    const context = setup();
    context.addNumber();
    jest
      .spyOn(context.service, 'list')
      .mockResolvedValue([{ number: phone, label: 'CRM number' }]);
    const { token } = await context.service.callGrant(
      actor,
      '+14155550199',
      phone,
      false,
    );
    context.memberships.findOneBy.mockResolvedValue(null);
    await expect(
      context.service.answer(token, '+14155550199', 'call'),
    ).resolves.toBe('reject');
    context.memberships.findOneBy.mockResolvedValue({
      id: actor.userWorkspaceId,
    });
    context.addNumber(actor.workspaceId, false);
    await expect(
      context.service.answer(token, '+14155550199', 'call'),
    ).resolves.toBe('reject');
  });
  it('expires call grants', async () => {
    const context = setup();
    context.addNumber();
    jest
      .spyOn(context.service, 'list')
      .mockResolvedValue([{ number: phone, label: 'CRM number' }]);
    const { token } = await context.service.callGrant(
      actor,
      '+14155550199',
      phone,
      false,
    );
    const key = `crm-phone-call:v1:${createHash('sha256').update(token).digest('hex')}`;
    context.documents.set(key, {
      ...(context.documents.get(key) as object),
      expiresAt: new Date(0).toISOString(),
    });
    await expect(
      context.service.answer(token, '+14155550199', 'call'),
    ).resolves.toBe('reject');
  });
  it('uses $3.50/month in server-owned checkout and allows promotion codes', async () => {
    const context = setup();
    context.documents.set('crm-phone-stripe-webhook:v1', { id: 'registered' });
    jest
      .spyOn(context.service, 'search')
      .mockResolvedValue([
        { number: phone, monthlyPriceCents: 350, currency: 'usd' },
      ]);
    await context.service.checkout(actor, phone, orderId);
    expect(context.stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        allow_promotion_codes: true,
        line_items: [
          expect.objectContaining({
            quantity: 1,
            price_data: expect.objectContaining({
              unit_amount: 350,
              currency: 'usd',
              recurring: { interval: 'month' },
            }),
          }),
        ],
      }),
      expect.any(Object),
    );
    expect(context.plivo.plivoRequest).not.toHaveBeenCalled();
  });
  it('requires billing permission before creating checkout', async () => {
    const context = setup();
    context.permissions.userHasWorkspaceSettingPermission.mockResolvedValue(
      false,
    );
    await expect(
      context.service.checkout(actor, phone, orderId),
    ).rejects.toThrow('billing');
    expect(context.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
  it('never adopts or repoints an existing campaign number', async () => {
    const context = setup();
    context.addOrder();
    context.plivo.plivoRequest.mockResolvedValue({
      number: phone,
      alias: 'AI campaign',
      application: 'ai-app',
    });
    await expect(context.service.reconcile(orderId)).rejects.toThrow(
      'not this CRM',
    );
    expect(
      context.plivo.plivoRequest.mock.calls.every((call) => call[0] === 'GET'),
    ).toBe(true);
  });
  it('does not purchase a number before confirmed payment', async () => {
    const context = setup();
    context.addOrder();
    context.stripe.checkout.sessions.retrieve.mockResolvedValue({
      id: 'cs_owned',
      livemode: true,
      client_reference_id: orderId,
      mode: 'subscription',
      subscription: 'sub_owned',
      payment_status: 'unpaid',
    });
    await context.service.reconcile(orderId);
    expect(context.plivo.plivoRequest).not.toHaveBeenCalled();
    expect(context.documents.get(`crm-phone-number:v1:${phone}`)).toMatchObject(
      { active: false },
    );
  });
  it('provisions only the selected new number into the dedicated CRM application', async () => {
    const context = setup();
    context.addOrder();
    context.plivo.plivoRequest
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({ status: 'fulfilled' });
    await context.service.reconcile(orderId);
    expect(context.plivo.plivoRequest).toHaveBeenCalledWith(
      'POST',
      `/PhoneNumber/${phone.slice(1)}/`,
      { app_id: 'crm-app', alias: `crm:${orderId}` },
    );
    expect(context.documents.get(`crm-phone-number:v1:${phone}`)).toMatchObject(
      { workspaceId: actor.workspaceId, active: true },
    );
  });
  it('suspends a paid number when its subscription is past due', async () => {
    const context = setup();
    context.addOrder({ providerNumber: phone });
    context.addNumber();
    context.stripe.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_owned',
      customer: 'cus_owned',
      status: 'past_due',
      items: {
        data: [
          {
            quantity: 1,
            price: {
              unit_amount: 350,
              currency: 'usd',
              recurring: { interval: 'month' },
            },
          },
        ],
      },
    });
    await context.service.reconcile(orderId);
    expect(context.documents.get(`crm-phone-number:v1:${phone}`)).toMatchObject(
      { active: false },
    );
  });
  it('does not buy again after a carrier timeout when the order’s own number is found', async () => {
    const context = setup();
    context.addOrder();
    context.plivo.plivoRequest.mockResolvedValue({
      number: phone,
      alias: `crm:${orderId}`,
      application: 'crm-app',
    });
    await context.service.reconcile(orderId);
    expect(
      context.plivo.plivoRequest.mock.calls.every((call) => call[0] === 'GET'),
    ).toBe(true);
  });
  it('never provisions a live carrier number from a Stripe test-mode payment', async () => {
    const context = setup();
    context.addOrder();
    context.stripe.checkout.sessions.retrieve.mockResolvedValue({
      id: 'cs_owned',
      livemode: false,
      client_reference_id: orderId,
      mode: 'subscription',
      subscription: 'sub_owned',
      payment_status: 'paid',
    });
    await expect(context.service.reconcile(orderId)).rejects.toThrow(
      'Test payments',
    );
    expect(context.plivo.plivoRequest).not.toHaveBeenCalled();
  });
  it('normalizes US local numbers before the SDK places a call', async () => {
    const context = setup();
    context.addNumber();
    jest
      .spyOn(context.service, 'list')
      .mockResolvedValue([{ number: phone, label: 'CRM number' }]);
    const grant = await context.service.callGrant(
      actor,
      '(415) 555-0199',
      phone,
      false,
    );
    expect(grant.destination).toBe('+14155550199');
    await expect(
      context.service.answer(grant.token, grant.destination, 'call-us-local'),
    ).resolves.toBe(`dial:${phone}:+14155550199:false`);
  });
});
