import { AsyncLocalStorage } from 'async_hooks';
import { type EntityManager } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  createHash,
  randomBytes,
  createCipheriv,
  createDecipheriv,
} from 'crypto';
import { IsNull, Repository } from 'typeorm';
import Stripe from 'stripe';
import { v5 } from 'uuid';
import { PermissionFlagType } from 'twenty-shared/constants';
import {
  KeyValuePairEntity,
  KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { PlivoService } from './plivo.service';

const ORDER_PREFIX = 'crm-phone-order:v1:';
const NUMBER_PREFIX = 'crm-phone-number:v1:';
const GRANT_PREFIX = 'crm-phone-call:v1:';
const WEBHOOK_KEY = 'crm-phone-stripe-webhook:v1';
const E164 = /^\+1[2-9]\d{9}$/;
type PhoneActor = {
  workspaceId: string;
  userId: string;
  userWorkspaceId: string;
};
type NumberOrder = PhoneActor & {
  number: string;
  sessionId: string;
  subscriptionId?: string;
  customerId?: string;
  status: 'awaiting_payment' | 'active' | 'suspended' | 'provisioning_failed';
  providerNumber?: string;
  createdAt: string;
  lastCheckedAt?: string;
  riskHold?: boolean;
};
type OwnedNumber = {
  workspaceId: string;
  orderId: string;
  number: string;
  active: boolean;
};
type CallGrant = PhoneActor & {
  number: string;
  destination: string;
  record: boolean;
  expiresAt: string;
  callUuid?: string;
};
const normalize = (number: string) => `+${number.replace(/\D/g, '')}`;

@Injectable()
export class CrmPhoneNumbersService {
  private readonly transactions = new AsyncLocalStorage<EntityManager>();
  private transaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    const current = this.transactions.getStore();
    return current
      ? work(current)
      : this.storage.manager.transaction((manager) =>
          this.transactions.run(manager, () => work(manager)),
        );
  }
  private repository() {
    return (
      this.transactions.getStore()?.getRepository(KeyValuePairEntity) ??
      this.storage
    );
  }
  private readonly logger = new Logger(CrmPhoneNumbersService.name);
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly storage: Repository<KeyValuePairEntity>,
    @InjectRepository(UserWorkspaceEntity)
    private readonly memberships: Repository<UserWorkspaceEntity>,
    private readonly config: TwentyConfigService,
    private readonly plivo: PlivoService,
    private readonly permissions: PermissionsService,
  ) {}
  private stripe() {
    const key = this.config.get('BILLING_STRIPE_API_KEY');
    if (!key)
      throw new ServiceUnavailableException(
        'Phone number checkout is not configured yet.',
      );
    return new Stripe(key);
  }
  private scope(key: string) {
    return {
      key,
      userId: IsNull(),
      workspaceId: IsNull(),
      applicationId: IsNull(),
      deletedAt: IsNull(),
    };
  }
  private async read<T>(key: string): Promise<T | null> {
    const row = await this.repository().findOne({ where: this.scope(key) });
    return row ? (row.value as unknown as T) : null;
  }
  private async save(key: string, value: unknown) {
    await this.repository().upsert(
      {
        key,
        userId: null,
        workspaceId: null,
        applicationId: null,
        type: KeyValuePairType.USER_VARIABLE,
        deletedAt: null,
        value: value as JSON,
      },
      {
        conflictPaths: ['key'],
        indexPredicate:
          '"userId" IS NULL AND "workspaceId" IS NULL AND "applicationId" IS NULL',
      },
    );
  }
  async list(workspaceId: string) {
    const rows = await this.storage
      .createQueryBuilder('number')
      .where('number.key LIKE :prefix', { prefix: `${NUMBER_PREFIX}%` })
      .andWhere(
        'number."workspaceId" IS NULL AND number."userId" IS NULL AND number."applicationId" IS NULL AND number."deletedAt" IS NULL',
      )
      .andWhere("number.value->>'workspaceId' = :workspaceId", { workspaceId })
      .getMany();
    return rows
      .map((row) => row.value as unknown as OwnedNumber)
      .filter((number) => number.active)
      .map(({ number }) => ({ number, label: 'CRM number' }));
  }
  async owned(workspaceId: string, number: string) {
    const owned = await this.read<OwnedNumber>(
      `${NUMBER_PREFIX}${normalize(number)}`,
    );
    if (!owned?.active || owned.workspaceId !== workspaceId)
      throw new ForbiddenException(
        'This workspace has not purchased that CRM number.',
      );
    return owned;
  }
  async search(areaCode: string) {
    if (!/^[2-9]\d{2}$/.test(areaCode))
      throw new BadRequestException('Enter a three-digit US area code.');
    const result = await this.plivo.plivoRequest<{
      objects: { number: string; voice_enabled?: boolean }[];
    }>(
      'GET',
      `/PhoneNumber/?country_iso=US&type=local&services=voice&pattern=${areaCode}&limit=10`,
    );
    return result.objects
      .filter((number) => number.voice_enabled !== false)
      .map(({ number }) => ({
        number: normalize(number),
        monthlyPriceCents: 350,
        currency: 'usd',
      }));
  }
  private encryptionKey() {
    return createHash('sha256').update(this.config.get('APP_SECRET')).digest();
  }
  private seal(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const data = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return {
      iv: iv.toString('base64'),
      data: data.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    };
  }
  private unseal(value: { iv: string; data: string; tag: string }) {
    const cipher = createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey(),
      Buffer.from(value.iv, 'base64'),
    );
    cipher.setAuthTag(Buffer.from(value.tag, 'base64'));
    return Buffer.concat([
      cipher.update(Buffer.from(value.data, 'base64')),
      cipher.final(),
    ]).toString('utf8');
  }
  private async ensureWebhook() {
    const existing = await this.read<{
      id: string;
      secret: ReturnType<CrmPhoneNumbersService['seal']>;
    }>(WEBHOOK_KEY);
    if (existing) return;
    await this.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [WEBHOOK_KEY],
      );
      if (await this.read(WEBHOOK_KEY)) return;
      const webhook = await this.stripe().webhookEndpoints.create(
        {
          url: `${this.config.get('SERVER_URL')}/webhooks/crm-phone-numbers/stripe`,
          enabled_events: [
            'checkout.session.completed',
            'checkout.session.async_payment_succeeded',
            'customer.subscription.updated',
            'customer.subscription.deleted',
            'invoice.paid',
            'invoice.payment_failed',
            'charge.dispute.created',
            'charge.refunded',
            'radar.early_fraud_warning.created',
          ],
        },
        { idempotencyKey: WEBHOOK_KEY },
      );
      if (!webhook.secret)
        throw new Error('Stripe did not return a signing secret.');
      await this.save(WEBHOOK_KEY, {
        id: webhook.id,
        secret: this.seal(webhook.secret),
      });
    });
  }
  async checkout(actor: PhoneActor, number: string, requestId: string) {
    if (
      !(await this.permissions.userHasWorkspaceSettingPermission({
        workspaceId: actor.workspaceId,
        userWorkspaceId: actor.userWorkspaceId,
        setting: PermissionFlagType.BILLING,
      }))
    )
      throw new ForbiddenException(
        'A workspace billing administrator must purchase numbers.',
      );
    const selected = normalize(number);
    if (!E164.test(selected) || !/^[0-9a-f-]{36}$/i.test(requestId))
      throw new BadRequestException('Choose a valid US number.');
    const orderId = v5(`${actor.workspaceId}:${requestId}`, v5.URL);
    return this.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`crm-number-checkout:${orderId}`],
      );
      const existing = await this.read<NumberOrder>(
        `${ORDER_PREFIX}${orderId}`,
      );
      if (existing && existing.number !== selected)
        throw new BadRequestException(
          'This checkout request is already used. Refresh and try again.',
        );
      if (existing?.sessionId) {
        const session = await this.stripe().checkout.sessions.retrieve(
          existing.sessionId,
        );
        if (session.url) return session.url;
        throw new BadRequestException(
          'Checkout has finished. Refresh your numbers.',
        );
      }
      // Never allocate, reassign, or repoint a number already present in the carrier account.
      const available = await this.search(selected.slice(2, 5));
      if (!available.some((entry) => entry.number === selected))
        throw new BadRequestException(
          'That number is no longer available. Search again.',
        );
      await this.ensureWebhook();
      const session = await this.stripe().checkout.sessions.create(
        {
          mode: 'subscription',
          client_reference_id: orderId,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                unit_amount: 350,
                recurring: { interval: 'month' },
                product_data: {
                  name: 'BlackSync CRM phone number',
                  description: `${selected} · Dedicated CRM line, separate from AI campaigns`,
                  metadata: { purpose: 'blacksync_crm_number' },
                },
              },
              quantity: 1,
            },
          ],
          allow_promotion_codes: true,
          metadata: { purchase_type: 'crm_phone_number', order_id: orderId },
          subscription_data: {
            metadata: { purchase_type: 'crm_phone_number', order_id: orderId },
          },
          success_url: `${this.config.get('SERVER_URL')}/phone-numbers?checkout=success`,
          cancel_url: `${this.config.get('SERVER_URL')}/phone-numbers?checkout=canceled`,
        },
        { idempotencyKey: `crm-number-checkout-${orderId}` },
      );
      await this.save(`${ORDER_PREFIX}${orderId}`, {
        ...actor,
        number: selected,
        sessionId: session.id,
        status: 'awaiting_payment',
        createdAt: new Date().toISOString(),
      } satisfies NumberOrder);
      if (!session.url) throw new Error('Stripe checkout URL is unavailable.');
      return session.url;
    });
  }
  async refresh(workspaceId?: string) {
    const query = this.storage
      .createQueryBuilder('orders')
      .where('orders.key LIKE :prefix', { prefix: `${ORDER_PREFIX}%` })
      .andWhere(
        'orders."workspaceId" IS NULL AND orders."userId" IS NULL AND orders."applicationId" IS NULL AND orders."deletedAt" IS NULL',
      );
    if (workspaceId)
      query.andWhere("orders.value->>'workspaceId' = :workspaceId", {
        workspaceId,
      });
    const rows = await query.getMany();
    for (const row of rows) {
      try {
        await this.reconcile(row.key.slice(ORDER_PREFIX.length));
      } catch {
        this.logger.warn(
          `CRM phone order ${row.key} needs reconciliation; no number was reassigned.`,
        );
      }
    }
  }
  async reconcile(orderId: string) {
    await this.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`crm-number-order:${orderId}`],
      );
      const key = `${ORDER_PREFIX}${orderId}`;
      const order = await this.read<NumberOrder>(key);
      if (!order) return;
      const stripe = this.stripe();
      const session = await stripe.checkout.sessions.retrieve(order.sessionId);
      if (
        session.client_reference_id !== orderId ||
        session.mode !== 'subscription'
      )
        throw new Error('Checkout ownership mismatch.');
      if (!session.livemode)
        throw new Error('Test payments cannot provision live CRM numbers.');
      const subscriptionId =
        typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id;
      if (!subscriptionId) return;
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const item = subscription.items.data[0];
      if (
        subscription.items.data.length !== 1 ||
        item.quantity !== 1 ||
        item.price.unit_amount !== 350 ||
        item.price.currency !== 'usd' ||
        item.price.recurring?.interval !== 'month'
      )
        throw new Error('Unexpected number price.');
      if (order.subscriptionId && order.subscriptionId !== subscription.id)
        throw new Error('Subscription ownership mismatch.');
      order.subscriptionId = subscription.id;
      order.customerId =
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;
      const paid =
        session.payment_status === 'paid' ||
        session.payment_status === 'no_payment_required';
      const active =
        paid && subscription.status === 'active' && !order.riskHold;
      order.status = active ? 'provisioning_failed' : 'suspended';
      await this.save(key, order);
      const numberKey = `${NUMBER_PREFIX}${order.number}`;
      const prior = await this.read<OwnedNumber>(numberKey);
      if (
        prior &&
        (prior.workspaceId !== order.workspaceId || prior.orderId !== orderId)
      )
        throw new Error('Number already belongs to another order.');
      if (active && !order.providerNumber) {
        const setup = await this.plivo.getVoiceSetup();
        if (!setup?.applicationId)
          throw new Error('CRM voice application is unavailable.');
        // A carrier timeout may have succeeded. Recover only this order's marked CRM number.
        let owned: {
          number: string;
          alias?: string;
          application?: string;
        } | null = null;
        try {
          owned = await this.plivo.plivoRequest(
            'GET',
            `/Number/${order.number.slice(1)}/`,
          );
        } catch (error) {
          if (
            !error ||
            typeof error !== 'object' ||
            !('status' in error) ||
            error.status !== 404
          )
            throw error;
        }
        if (owned) {
          if (
            owned.alias !== `crm:${orderId}` ||
            !owned.application?.includes(setup.applicationId)
          )
            throw new Error('Existing carrier number is not this CRM order.');
        } else {
          await this.plivo.plivoRequest(
            'POST',
            `/PhoneNumber/${order.number.slice(1)}/`,
            { app_id: setup.applicationId, alias: `crm:${orderId}` },
          );
        }
        order.providerNumber = order.number;
      }
      order.status = active && order.providerNumber ? 'active' : 'suspended';
      order.lastCheckedAt = new Date().toISOString();
      await this.save(numberKey, {
        workspaceId: order.workspaceId,
        orderId,
        number: order.number,
        active: order.status === 'active',
      } satisfies OwnedNumber);
      await this.save(key, order);
    });
  }
  async webhook(raw: Buffer, signature: string) {
    const setting = await this.read<{
      secret: ReturnType<CrmPhoneNumbersService['seal']>;
    }>(WEBHOOK_KEY);
    if (!setting) throw new BadRequestException('Webhook is not configured.');
    const event = this.stripe().webhooks.constructEvent(
      raw,
      signature,
      this.unseal(setting.secret),
    );
    // Stripe's current session/subscription state is authoritative; stale event delivery cannot reactivate a canceled line.
    if (event.type.startsWith('checkout.session.')) {
      const session = event.data.object as Stripe.Checkout.Session;
      if (
        session.client_reference_id &&
        session.metadata?.purchase_type === 'crm_phone_number'
      ) {
        const order = await this.read<NumberOrder>(
          `${ORDER_PREFIX}${session.client_reference_id}`,
        );
        if (order?.sessionId === session.id)
          await this.reconcile(session.client_reference_id);
      }
    } else {
      // Includes subscription lifecycle, renewal, failed payment, refund and dispute/fraud events.
      if (
        [
          'charge.dispute.created',
          'charge.refunded',
          'radar.early_fraud_warning.created',
        ].includes(event.type)
      ) {
        const object = event.data.object as unknown as Record<string, unknown>;
        const chargeId =
          event.type === 'charge.refunded'
            ? object.id
            : typeof object.charge === 'string'
              ? object.charge
              : (object.charge as { id?: string } | undefined)?.id;
        if (typeof chargeId === 'string') {
          const charge = await this.stripe().charges.retrieve(chargeId);
          const customerId =
            typeof charge.customer === 'string'
              ? charge.customer
              : charge.customer?.id;
          if (customerId) {
            const affected = await this.storage
              .createQueryBuilder('risk')
              .where('risk.key LIKE :prefix', { prefix: `${ORDER_PREFIX}%` })
              .andWhere(
                'risk."workspaceId" IS NULL AND risk."userId" IS NULL AND risk."applicationId" IS NULL',
              )
              .andWhere("risk.value->>'customerId' = :customerId", {
                customerId,
              })
              .getMany();
            for (const row of affected) {
              await this.transaction(async (manager) => {
                const orderId = row.key.slice(ORDER_PREFIX.length);
                await manager.query(
                  'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
                  [`crm-number-order:${orderId}`],
                );
                const order = await this.read<NumberOrder>(row.key);
                if (!order) return;
                await this.save(row.key, {
                  ...order,
                  riskHold: true,
                  status: 'suspended',
                });
                const number = await this.read<OwnedNumber>(
                  `${NUMBER_PREFIX}${order.number}`,
                );
                if (number?.orderId === orderId)
                  await this.save(`${NUMBER_PREFIX}${order.number}`, {
                    ...number,
                    active: false,
                  });
              });
            }
          }
        }
      }
      await this.refresh();
    }
  }
  capabilities() {
    return {
      checkoutConfigured: /^(sk|rk)_live_/.test(
        this.config.get('BILLING_STRIPE_API_KEY') ?? '',
      ),
      carrierConfigured: this.plivo.hasCredentials(),
      monthlyPriceCents: 350,
      currency: 'usd',
    };
  }
  async settings(workspaceId: string) {
    const rows = await this.storage
      .createQueryBuilder('orders')
      .where('orders.key LIKE :prefix', { prefix: `${ORDER_PREFIX}%` })
      .andWhere(
        'orders."workspaceId" IS NULL AND orders."userId" IS NULL AND orders."applicationId" IS NULL AND orders."deletedAt" IS NULL',
      )
      .andWhere("orders.value->>'workspaceId' = :workspaceId", { workspaceId })
      .getMany();
    return {
      numbers: await this.list(workspaceId),
      orders: rows.map((row) => {
        const order = row.value as unknown as NumberOrder;
        return {
          id: row.key.slice(ORDER_PREFIX.length),
          number: order.number,
          status: order.status,
          lastCheckedAt: order.lastCheckedAt ?? null,
        };
      }),
      checkoutConfigured: /^(sk|rk)_live_/.test(
        this.config.get('BILLING_STRIPE_API_KEY') ?? '',
      ),
      carrierConfigured: this.plivo.hasCredentials(),
      monthlyPriceCents: 350,
      currency: 'usd',
    };
  }
  async portal(workspaceId: string, userWorkspaceId: string, orderId: string) {
    if (
      !(await this.permissions.userHasWorkspaceSettingPermission({
        workspaceId,
        userWorkspaceId,
        setting: PermissionFlagType.BILLING,
      }))
    )
      throw new ForbiddenException('Billing administrator access is required.');
    const order = await this.read<NumberOrder>(`${ORDER_PREFIX}${orderId}`);
    if (!order || order.workspaceId !== workspaceId || !order.customerId)
      throw new ForbiddenException('Billing for that number is unavailable.');
    return (
      await this.stripe().billingPortal.sessions.create({
        customer: order.customerId,
        return_url: `${this.config.get('SERVER_URL')}/phone-numbers`,
      })
    ).url;
  }
  async cleanupGrants() {
    await this.storage
      .createQueryBuilder()
      .delete()
      .where('key LIKE :prefix', { prefix: `${GRANT_PREFIX}%` })
      .andWhere(
        '"workspaceId" IS NULL AND "userId" IS NULL AND "applicationId" IS NULL',
      )
      .andWhere("value->>'expiresAt' < :before", {
        before: new Date(Date.now() - 86400000).toISOString(),
      })
      .execute();
  }
  async callGrant(
    actor: PhoneActor,
    destination: string,
    requestedNumber: string | null,
    record: boolean,
  ) {
    const to = normalize(destination);
    if (!/^\+[1-9]\d{5,14}$/.test(to))
      throw new BadRequestException('Enter a valid destination.');
    const numbers = await this.list(actor.workspaceId);
    const caller = requestedNumber
      ? normalize(requestedNumber)
      : numbers[0]?.number;
    if (!caller)
      throw new ForbiddenException(
        'Purchase a CRM number for this workspace before calling.',
      );
    await this.owned(actor.workspaceId, caller);
    const token = randomBytes(32).toString('base64url');
    await this.save(
      `${GRANT_PREFIX}${createHash('sha256').update(token).digest('hex')}`,
      {
        ...actor,
        number: caller,
        destination: to,
        record,
        expiresAt: new Date(Date.now() + 90000).toISOString(),
      } satisfies CallGrant,
    );
    return token;
  }
  async answer(
    token: string | undefined,
    destination: string | undefined,
    callUuid: string | undefined,
  ) {
    if (
      !token ||
      !/^[A-Za-z0-9_-]{43}$/.test(token) ||
      !destination ||
      !callUuid
    )
      return this.plivo.buildAnswerXml(undefined, undefined);
    const key = `${GRANT_PREFIX}${createHash('sha256').update(token).digest('hex')}`;
    return this.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [key],
      );
      const grant = await this.read<CallGrant>(key);
      const to = normalize(
        destination.replace(/^sip:/i, '').replace(/@.*$/, ''),
      );
      if (
        !grant ||
        Date.parse(grant.expiresAt) < Date.now() ||
        grant.destination !== to ||
        (grant.callUuid && grant.callUuid !== callUuid)
      )
        return this.plivo.buildAnswerXml(undefined, undefined);
      if (
        !(await (
          this.transactions.getStore()?.getRepository(UserWorkspaceEntity) ??
          this.memberships
        ).findOneBy({
          id: grant.userWorkspaceId,
          workspaceId: grant.workspaceId,
          userId: grant.userId,
        }))
      )
        return this.plivo.buildAnswerXml(undefined, undefined);
      try {
        await this.owned(grant.workspaceId, grant.number);
      } catch {
        return this.plivo.buildAnswerXml(undefined, undefined);
      }
      await this.save(key, { ...grant, callUuid });
      return this.plivo.buildAnswerXml(to, grant.number, grant.record);
    });
  }
}
