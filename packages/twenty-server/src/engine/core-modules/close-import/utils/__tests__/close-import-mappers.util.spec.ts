import {
  buildCallNote,
  getCloseStatusColor,
  makeUniqueName,
  toCamelCaseFieldName,
  toSelectOptionValue,
  mapCloseEmails,
  mapCloseOpportunityStage,
  mapClosePhones,
  splitFullName,
} from 'src/engine/core-modules/close-import/utils/close-import-mappers.util';

describe('close import mappers', () => {
  it('splits a full name into first and last name', () => {
    expect(splitFullName('Mary Ann Smith')).toEqual({
      firstName: 'Mary',
      lastName: 'Ann Smith',
    });
    expect(splitFullName(null)).toEqual({ firstName: '', lastName: '' });
  });

  it('keeps the first email as primary', () => {
    expect(
      mapCloseEmails([{ email: 'A@x.com ' }, { email: 'b@x.com' }]),
    ).toEqual({ primaryEmail: 'a@x.com', additionalEmails: ['b@x.com'] });
  });

  it('parses E.164 phones', () => {
    const phones = mapClosePhones([{ phone: '+14155550123' }]);

    expect(phones.primaryPhoneNumber).toBe('4155550123');
    expect(phones.primaryPhoneCallingCode).toBe('+1');
    expect(phones.additionalPhones).toBeNull();
  });

  it('maps Close statuses onto pipeline stages', () => {
    expect(
      mapCloseOpportunityStage({ status_type: 'won', status_label: 'Won' }),
    ).toBe('CUSTOMER');
    expect(
      mapCloseOpportunityStage({
        status_type: 'active',
        status_label: 'Proposal sent',
      }),
    ).toBe('PROPOSAL');
    expect(
      mapCloseOpportunityStage({
        status_type: 'active',
        status_label: 'Demo booked',
      }),
    ).toBe('MEETING');
    expect(
      mapCloseOpportunityStage({
        status_type: 'active',
        status_label: 'Active',
      }),
    ).toBe('NEW');
  });

  it('summarizes a call in the note title', () => {
    expect(
      buildCallNote({
        id: 'acti_1',
        lead_id: null,
        contact_id: null,
        date_created: '2026-01-01T00:00:00Z',
        direction: 'outbound',
        duration: 192,
        disposition: 'answered',
        note: 'Talked pricing',
        phone: '+14155550123',
        recording_url: 'https://close.com/rec.mp3',
        voicemail_url: null,
      }),
    ).toEqual({
      title: 'Outbound call · 3m 12s · Answered',
      markdown:
        'Talked pricing\n\nPhone: +14155550123\n\n[Call recording](https://close.com/rec.mp3)',
    });
  });

  it('builds field names and option values from Close labels', () => {
    expect(toCamelCaseFieldName('Enterprise / Corporate Sales')).toBe(
      'enterpriseCorporateSales',
    );
    expect(toSelectOptionValue('New prospect')).toBe('NEW_PROSPECT');
    expect(toSelectOptionValue('1st call')).toBe('OPTION_1ST_CALL');
    expect(makeUniqueName('salesStage', ['salesStage'])).toBe('salesStage2');
  });

  it('colors won and lost Close statuses', () => {
    expect(getCloseStatusColor({ label: 'Signed', type: 'won' }, 3)).toBe(
      'green',
    );
    expect(getCloseStatusColor({ label: 'Bad Fit' }, 2)).toBe('red');
    expect(getCloseStatusColor({ label: 'Potential' }, 0)).toBe('gray');
  });
});
