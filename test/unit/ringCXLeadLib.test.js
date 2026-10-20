import { formatCxLeadPassDate } from '../../src/ringcx/lib/formatCxLeadPassDate';
import { formatCxVoicemailAgentNotes } from '../../src/ringcx/lib/formatCxVoicemailAgentNotes';
import {
  CX_LEAD_MAX_PHONE_NUMBERS,
  parseCxLeadPhoneNumbers,
} from '../../src/ringcx/lib/parseCxLeadPhoneNumbers';
import { isLeadNumberDialed } from '../../src/ringcx/lib/isLeadNumberDialed';
import { formatHistoryLead } from '../../src/ringcx/services/CxCallHistory/formatHistoryLead';

describe('formatCxLeadPassDate', () => {
  const expected = (date, options) =>
    new Intl.DateTimeFormat(options.locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: options.timeZone,
    }).format(date);

  test('reads the pass date in server time and shows it in the agent zone', () => {
    const options = { locale: 'en-US', timeZone: 'Asia/Shanghai' };

    // 17:11 in New York (EDT, UTC-4) is 05:11 the next day in Shanghai.
    expect(formatCxLeadPassDate('2026-10-19 17:11:00', options)).toBe(
      expected(new Date('2026-10-19T21:11:00Z'), options),
    );
  });

  test('follows the server zone across daylight saving', () => {
    const options = { locale: 'en-US', timeZone: 'UTC' };

    // January is EST, UTC-5.
    expect(formatCxLeadPassDate('2026-01-15 09:30:00', options)).toBe(
      expected(new Date('2026-01-15T14:30:00Z'), options),
    );
  });

  test("uses the agent's locale", () => {
    const options = { locale: 'de-DE', timeZone: 'America/New_York' };

    expect(formatCxLeadPassDate('2026-10-19 17:11:00', options)).toBe(
      expected(new Date('2026-10-19T21:11:00Z'), options),
    );
  });

  test.each(['', 'yesterday', '2026-10-19T17:11:00Z', '2026-13-40 99:99:99'])(
    'returns %p as is when it does not parse',
    (value) => {
      expect(formatCxLeadPassDate(value, { timeZone: 'UTC' })).toBe(value);
    },
  );
});

describe('formatCxVoicemailAgentNotes', () => {
  const labels = {
    manualEntry: 'Manual entry',
    accountAudio: 'Account audio',
    globalAudio: 'Global audio',
  };

  test('leaves the notes of other dispositions as they are', () => {
    expect(
      formatCxVoicemailAgentNotes('12345/Greeting, Promo', 'ANSWER', labels),
    ).toBe('12345/Greeting, Promo');
    expect(formatCxVoicemailAgentNotes(undefined, 'ANSWER', labels)).toBe('');
  });

  test.each(['VOICEMAIL-LEFT', 'VOICEMAIL_LEFT'])(
    'groups the dropped audio by library for %s',
    (disposition) => {
      expect(
        formatCxVoicemailAgentNotes(
          '12345/Greeting, Promo, 67890/Follow up',
          disposition,
          labels,
        ),
      ).toBe('Account audio: Greeting, Follow up\nGlobal audio: Promo');
    },
  );

  test('labels a manually entered message', () => {
    expect(
      formatCxVoicemailAgentNotes(' app://message-1 ', 'VOICEMAIL-LEFT', labels),
    ).toBe('Manual entry');
  });

  test('ignores a manual message appended after the library audio', () => {
    expect(
      formatCxVoicemailAgentNotes(
        '12345/Greeting, app://message-1',
        'VOICEMAIL-LEFT',
        labels,
      ),
    ).toBe('Account audio: Greeting');
  });

  test('shows only the libraries that were used', () => {
    expect(
      formatCxVoicemailAgentNotes('Promo, Holiday', 'VOICEMAIL_LEFT', labels),
    ).toBe('Global audio: Promo, Holiday');
    expect(formatCxVoicemailAgentNotes('', 'VOICEMAIL_LEFT', labels)).toBe('');
  });
});

describe('parseCxLeadPhoneNumbers', () => {
  test('caps a lead at six numbers, as Agent One does', () => {
    expect(CX_LEAD_MAX_PHONE_NUMBERS).toBe(6);
  });

  test('reads one number per line into E.164, US numbers by default', () => {
    expect(
      parseCxLeadPhoneNumbers('(650) 844-6685\n+44 20 7946 0958'),
    ).toEqual({
      phoneNumbers: ['+16508446685', '+442079460958'],
      invalidLines: [],
    });
  });

  test('skips blank lines and trims each line', () => {
    expect(parseCxLeadPhoneNumbers('\n  6508446685  \n\n')).toEqual({
      phoneNumbers: ['+16508446685'],
      invalidLines: [],
    });
  });

  test('keeps invalid lines as typed, and a separator makes a line invalid', () => {
    expect(
      parseCxLeadPhoneNumbers(
        '6508446685\n12\n6508446685, 6505550100\n6505550100;\nabc',
      ),
    ).toEqual({
      phoneNumbers: ['+16508446685'],
      invalidLines: ['12', '6508446685, 6505550100', '6505550100;', 'abc'],
    });
  });

  test('reads national numbers in another default country', () => {
    expect(parseCxLeadPhoneNumbers('020 7946 0958', 'GB').phoneNumbers).toEqual(
      ['+442079460958'],
    );
  });

  test('gives nothing for an empty field', () => {
    expect(parseCxLeadPhoneNumbers('')).toEqual({
      phoneNumbers: [],
      invalidLines: [],
    });
  });
});

describe('formatHistoryLead', () => {
  const lead = {
    id: 5725,
    externalId: 'ext-1',
    title: 'Dr',
    suffix: 'Jr',
    firstName: 'Embbnux',
    midName: 'M',
    lastName: 'Labs',
    email: 'labs@example.com',
    address1: '1 Main St',
    address2: 'Suite 2',
    city: 'Belmont',
    state: 'CA',
    zip: '94002',
    gateKeeper: 'Front desk',
    listDesc: 'Spring list',
    leadState: 'COMPLETE',
    leadPasses: 2,
    aux1: 'a1',
    aux2: 'a2',
    aux3: 'a3',
    aux4: 'a4',
    aux5: 'a5',
    extraData: { Notes: 'VIP' },
  };

  test('renames the call history lead to the Lead tab fields', () => {
    expect(
      formatHistoryLead({ type: 'LEAD', campaignId: 12, lead }),
    ).toEqual({
      leadId: '5725',
      externId: 'ext-1',
      title: 'Dr',
      suffix: 'Jr',
      firstName: 'Embbnux',
      midName: 'M',
      lastName: 'Labs',
      email: 'labs@example.com',
      address1: '1 Main St',
      address2: 'Suite 2',
      city: 'Belmont',
      state: 'CA',
      zip: '94002',
      gateKeeper: 'Front desk',
      listDesc: 'Spring list',
      leadState: 'COMPLETE',
      leadPasses: '2',
      auxData1: 'a1',
      auxData2: 'a2',
      auxData3: 'a3',
      auxData4: 'a4',
      auxData5: 'a5',
      extraData: { Notes: 'VIP' },
      campaignId: '12',
    });
  });

  test('defaults the extra data and leaves out a missing campaign', () => {
    const formatted = formatHistoryLead({
      type: 'LEAD',
      lead: { id: 5725, leadPasses: 0 },
    });

    expect(formatted).toEqual(
      expect.objectContaining({
        leadId: '5725',
        leadPasses: '0',
        extraData: {},
        campaignId: undefined,
      }),
    );
  });

  test.each([
    ['a manual call', { type: 'MANUAL' }],
    ['an inbound call', undefined],
    ['a lead call without a lead id', { type: 'LEAD', lead: { firstName: 'A' } }],
    ['a lead call without a lead', { type: 'LEAD' }],
  ])('has no lead for %s', (_name, outbound) => {
    expect(formatHistoryLead(outbound)).toBeUndefined();
  });
});

describe('isLeadNumberDialed', () => {
  test('tells a number in the lead dialed list', () => {
    const lead = { dialedList: ['+16505550100'] };

    expect(isLeadNumberDialed(lead, '+16505550100')).toBe(true);
    expect(isLeadNumberDialed(lead, '+16505550101')).toBe(false);
  });

  test('ignores formatting and a country code one side leaves out', () => {
    // The progressive dialer reports the number the server dialed, which
    // may come without the country code the lead's number has.
    const lead = { dialedList: ['6505550100'] };

    expect(isLeadNumberDialed(lead, '+1 (650) 555-0100')).toBe(true);
  });

  test('does not match a short number by its end', () => {
    const lead = { dialedList: ['+16505550100'] };

    expect(isLeadNumberDialed(lead, '0100')).toBe(false);
  });

  test('knows no dialed number without a list, a lead or a number', () => {
    expect(isLeadNumberDialed({}, '+16505550100')).toBe(false);
    expect(isLeadNumberDialed(null, '+16505550100')).toBe(false);
    expect(isLeadNumberDialed({ dialedList: ['+16505550100'] }, '')).toBe(false);
  });
});
