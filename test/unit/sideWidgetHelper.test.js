import {
  getSideWidgetAppTabId,
  getSideWidgetContact,
  getSideWidgetPageInfo,
  isSameSideWidgetContact,
} from '../../src/app/views/SideWidgetView/SideWidget.helper';

describe('SideWidget helper', () => {
  test('creates a stable app tab id', () => {
    expect(getSideWidgetAppTabId('crm')).toBe('side-widget-app-crm');
  });

  test('parses a wrapped JSON schema page and valid actions', () => {
    const result = getSideWidgetPageInfo({
      page: {
        type: 'json-schema',
        schema: { type: 'object' },
        uiSchema: { name: { 'ui:placeholder': 'Name' } },
        formData: { name: 'Case 123' },
      },
      actions: [{ id: 'home', label: 'Home' }, { label: 'Missing id' }],
    });

    expect(result).toEqual({
      page: {
        type: 'json-schema',
        schema: { type: 'object' },
        uiSchema: { name: { 'ui:placeholder': 'Name' } },
        formData: { name: 'Case 123' },
      },
      actions: [{ id: 'home', label: 'Home' }],
    });
  });

  test('rejects unsupported page responses', () => {
    expect(
      getSideWidgetPageInfo({
        page: { type: 'html', schema: { type: 'object' } },
      }),
    ).toEqual({ page: null, actions: [] });
    expect(getSideWidgetPageInfo(null)).toEqual({ page: null, actions: [] });
    expect(getSideWidgetPageInfo({ type: 'json-schema', schema: [] })).toEqual({
      page: null,
      actions: [],
    });
  });

  test('parses direct pages and normalizes optional action fields', () => {
    expect(
      getSideWidgetPageInfo({
        type: 'json-schema',
        schema: { type: 'object' },
        uiSchema: [],
        formData: 'invalid',
        actions: [
          { id: 'save', color: 'primary' },
          null,
          { id: 3, label: 'Invalid' },
        ],
      }),
    ).toEqual({
      page: { type: 'json-schema', schema: { type: 'object' } },
      actions: [{ id: 'save', label: 'save', color: 'primary' }],
    });
    expect(getSideWidgetPageInfo({ page: null, actions: 'invalid' })).toEqual({
      page: null,
      actions: [],
    });
  });

  test('builds call context with the matched contact', () => {
    const contact = getSideWidgetContact(
      {
        from: '+16505550100',
        fromUserName: 'Caller',
        contactMatch: {
          id: 'contact-1',
          name: 'Matched caller',
        },
      },
      'from',
    );

    expect(contact).toEqual({
      phoneNumber: '+16505550100',
      name: 'Matched caller',
      id: 'contact-1',
    });
  });

  test('builds inbound and outbound contacts without malformed matches', () => {
    const session = {
      from: '+16505550100',
      fromUserName: 'Caller',
      to: '+16505550101',
      toUserName: 'Callee',
      contactMatch: [],
    };

    expect(getSideWidgetContact(session, 'from')).toEqual({
      phoneNumber: '+16505550100',
      name: 'Caller',
    });
    expect(getSideWidgetContact(session, 'to')).toEqual({
      phoneNumber: '+16505550101',
      name: 'Callee',
    });
  });

  test('matches contacts by an alternate phone number', () => {
    expect(
      isSameSideWidgetContact(
        {
          id: 'contact-1',
          phoneNumbers: [{ phoneNumber: '+16505550100' }],
        },
        { phoneNumber: '+16505550100' },
      ),
    ).toBe(true);
  });

  test('matches ids, direct phone numbers, and reverse alternate numbers', () => {
    expect(isSameSideWidgetContact({ id: '1' }, { id: '1' })).toBe(true);
    expect(
      isSameSideWidgetContact(
        { phoneNumber: '+16505550100' },
        { phoneNumber: '+16505550100' },
      ),
    ).toBe(true);
    expect(
      isSameSideWidgetContact(
        { phoneNumber: '+16505550100' },
        { phoneNumbers: [{ phoneNumber: '+16505550100' }] },
      ),
    ).toBe(true);
    expect(isSameSideWidgetContact(null, { id: '1' })).toBe(false);
    expect(isSameSideWidgetContact({ id: '1' }, null)).toBe(false);
    expect(isSameSideWidgetContact({ id: '1' }, { id: '2' })).toBe(false);
  });

  test('normalizes formatted phone numbers before matching', () => {
    expect(
      isSameSideWidgetContact(
        { phoneNumber: '+1 (650) 555-0100' },
        { phoneNumber: '+16505550100' },
      ),
    ).toBe(true);
  });
});
