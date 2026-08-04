import {
  checkThirdPartySettings,
  findSettingItem,
  formatContacts,
  getImageUri,
  getTranscriptText,
  isSafeAuthorizationLink,
  searchContactPhoneNumbers,
} from '../../next/app/services/ThirdParty/ThirdParty.helper';

describe('ThirdParty helpers', () => {
  let consoleWarn;

  beforeEach(() => {
    consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarn.mockRestore();
  });

  test('normalizes legacy boolean settings and validates common setting types', () => {
    const settings = checkThirdPartySettings([
      { name: 'Legacy toggle', value: true },
      { id: 'toggle', name: 'Toggle', type: 'boolean', value: false },
      { id: 'button', name: 'Button', type: 'button', buttonLabel: 'Run' },
      {
        id: 'option',
        name: 'Option',
        type: 'option',
        value: 'one',
        options: [{ id: 'one', name: 'One' }],
      },
      {
        id: 'multi',
        name: 'Multiple',
        type: 'option',
        multiple: true,
        value: ['one', 2],
        options: [
          { id: 'one', name: 'One' },
          { id: 2, name: 'Two' },
        ],
      },
      {
        id: 'link',
        name: 'Documentation',
        type: 'externalLink',
        uri: 'https://example.com/docs',
      },
    ]);

    expect(settings).toHaveLength(6);
    expect(settings[0]).toEqual({
      id: 'Legacy toggle',
      name: 'Legacy toggle',
      type: 'boolean',
      value: true,
    });
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  test('filters malformed top-level settings and reports them', () => {
    const settings = checkThirdPartySettings([
      { id: 'missing-name', type: 'boolean', value: true },
      { id: 'bad-order', name: 'Bad order', type: 'boolean', value: true, order: 'first' },
      { name: 'Missing type', value: 'yes' },
      { id: 'bad-toggle', name: 'Bad toggle', type: 'boolean', value: 'yes' },
      { id: 'bad-button', name: 'Bad button', type: 'button', buttonLabel: 3 },
      { id: 'bad-button-type', name: 'Bad button type', type: 'button', buttonType: 3 },
      { id: 'bad-link', name: 'Bad link', type: 'externalLink', uri: '/relative' },
      { id: 'unknown', name: 'Unknown', type: 'unsupported' },
    ]);

    expect(settings).toEqual([]);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Invalid settings:',
      expect.arrayContaining([expect.objectContaining({ id: 'bad-toggle' })]),
    );
  });

  test('validates option values and option metadata', () => {
    const settings = checkThirdPartySettings([
      { id: 'missing-options', name: 'Missing', type: 'option', value: 'one' },
      {
        id: 'bad-value',
        name: 'Bad value',
        type: 'option',
        value: 'two',
        options: [{ id: 'one', name: 'One' }],
      },
      {
        id: 'bad-multi-value',
        name: 'Bad multiple value',
        type: 'option',
        multiple: true,
        value: 'one',
        options: [{ id: 'one', name: 'One' }],
      },
      {
        id: 'unknown-multi-value',
        name: 'Unknown multiple value',
        type: 'option',
        multiple: true,
        value: ['two'],
        options: [{ id: 'one', name: 'One' }],
      },
      {
        id: 'bad-option',
        name: 'Bad option',
        type: 'option',
        value: '',
        options: [{ id: '', name: 3 }],
      },
    ]);

    expect(settings).toEqual([]);
  });

  test('filters invalid section children and recursively validates groups', () => {
    const settings = checkThirdPartySettings([
      { id: 'empty-section', name: 'Empty section', type: 'section' },
      {
        id: 'section',
        name: 'Section',
        type: 'section',
        items: [
          { id: 'toggle', name: 'Toggle', type: 'boolean', value: true },
          { id: 'copy', name: 'Copy', type: 'typography', value: 'Text' },
          { id: 'notice', name: 'Notice', type: 'admonition', value: 'Info' },
          { id: 'values', name: 'Values', type: 'array', value: ['one', 'two'] },
          { id: 'text', name: 'Text', type: 'string', value: 'value' },
          { id: 'bad-array', name: 'Bad array', type: 'array', value: ['one', 2] },
          { id: 'bad-copy', name: 'Bad copy', type: 'typography', value: true },
          { id: 'bad-option', name: 'Bad option', type: 'option', options: 'nope' },
          { id: '', name: 'Missing id', type: 'string', value: 'value' },
        ],
      },
      {
        id: 'group',
        name: 'Group',
        type: 'group',
        items: [
          { id: 'nested', name: 'Nested', type: 'boolean', value: true },
          { id: 'invalid', name: 'Invalid', type: 'boolean', value: 'yes' },
        ],
      },
    ]);

    expect(settings).toEqual([
      expect.objectContaining({
        id: 'section',
        items: expect.arrayContaining([
          expect.objectContaining({ id: 'toggle' }),
          expect.objectContaining({ id: 'copy' }),
          expect.objectContaining({ id: 'notice' }),
          expect.objectContaining({ id: 'values' }),
          expect.objectContaining({ id: 'text' }),
        ]),
      }),
      expect.objectContaining({
        id: 'group',
        items: [expect.objectContaining({ id: 'nested' })],
      }),
    ]);
    expect(consoleWarn).toHaveBeenCalledWith(
      'Invalid items in section Section:',
      expect.any(Array),
    );
  });

  test('finds settings recursively and handles missing ids', () => {
    const settings = [
      {
        id: 'group',
        type: 'group',
        items: [{ id: 'nested', type: 'boolean', value: true }],
      },
      { id: 'top', type: 'boolean', value: true },
    ];

    expect(findSettingItem(settings, 'nested')).toEqual(expect.objectContaining({ id: 'nested' }));
    expect(findSettingItem(settings, 'top')).toEqual(expect.objectContaining({ id: 'top' }));
    expect(findSettingItem(settings, 'missing')).toBeNull();
    expect(findSettingItem(settings)).toBeNull();
  });

  test('normalizes known, suffixed, missing, and custom phone types', () => {
    expect(
      formatContacts([
        {
          id: 'contact',
          phoneNumbers: [
            { phoneNumber: '1', phoneType: 'mobile' },
            { phoneNumber: '2', phoneType: 'businessPhone' },
            { phoneNumber: '3', phoneType: 'custom' },
            { phoneNumber: '4' },
          ],
        },
        { id: 'without-phones' },
      ]),
    ).toEqual([
      expect.objectContaining({
        phoneNumbers: [
          { phoneNumber: '1', phoneType: 'mobile' },
          { phoneNumber: '2', phoneType: 'business' },
          { phoneNumber: '3', phoneType: 'other' },
          { phoneNumber: '4', phoneType: 'unknown' },
        ],
      }),
      { id: 'without-phones', phoneNumbers: undefined },
    ]);
    expect(formatContacts()).toEqual([]);
  });

  test('accepts only absolute HTTP and image data URIs', () => {
    expect(getImageUri('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    expect(getImageUri('http://example.com/image.png')).toBe('http://example.com/image.png');
    expect(getImageUri('https://example.com/image.png')).toBe('https://example.com/image.png');
    expect(getImageUri('/image.png')).toBeNull();
    expect(getImageUri('javascript:alert(1)')).toBeNull();
    expect(getImageUri()).toBeNull();
  });

  test('formats transcript speakers using call participant fallbacks', () => {
    const transcript = {
      context: {
        participants: [
          { participantId: 'from', extensionId: '101', name: 'Original from' },
          { participantId: 'to', extensionId: '202', name: 'Original to' },
          { participantId: 'guest', name: 'Guest' },
        ],
      },
      transcripts: [
        { participantId: 'from', text: 'Hello' },
        { participantId: 'to', text: 'Hi' },
        { participantId: 'guest', text: 'Welcome' },
      ],
    };
    const call = {
      fromName: 'Caller',
      toName: 'Callee',
      from: { extensionId: '101', name: '', phoneNumber: '100', extensionNumber: '10' },
      to: { extensionId: '202', name: '', phoneNumber: '200', extensionNumber: '20' },
    };

    expect(getTranscriptText(transcript, call)).toBe(
      'Caller: Hello\nCallee: Hi\nGuest: Welcome',
    );
    expect(getTranscriptText(null, call)).toBe('');
    expect(getTranscriptText({ transcripts: [] }, call)).toBe('');
  });

  test('uses participant phone and extension fallbacks when display names are absent', () => {
    const transcript = {
      context: {
        participants: [
          { participantId: 'from', extensionId: '101', name: 'Original from' },
          { participantId: 'to', extensionId: '202', name: 'Original to' },
        ],
      },
      transcripts: [
        { participantId: 'from', text: 'One' },
        { participantId: 'to', text: 'Two' },
      ],
    };

    expect(
      getTranscriptText(transcript, {
        from: { extensionId: '101', phoneNumber: '100' },
        to: { extensionId: '202', extensionNumber: '20' },
      }),
    ).toBe('100: One\n20: Two');
  });

  test('searches every matching contact phone number', () => {
    const contacts = [
      {
        id: '1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        type: 'person',
        phoneNumbers: [
          { phoneNumber: '+16505550100', phoneType: 'mobilePhone' },
          { phoneNumber: '+16505550101', phoneType: 'custom' },
        ],
      },
      { id: '2', name: 'Grace Hopper', phoneNumbers: [{ phoneNumber: '+16505550200' }] },
      { id: '3', name: 'No phone' },
    ];

    expect(searchContactPhoneNumbers(contacts, 'ADA', 'lead')).toEqual([
      expect.objectContaining({
        id: '1+16505550100',
        name: 'Ada Lovelace',
        phoneType: 'mobile',
        entityType: 'lead',
        isPrimary: true,
        contact: contacts[0],
      }),
      expect.objectContaining({
        id: '1+16505550101',
        phoneType: 'other',
        isPrimary: false,
        contact: contacts[0],
      }),
    ]);
    expect(searchContactPhoneNumbers(contacts, '0200')).toEqual([
      expect.objectContaining({
        name: 'Grace Hopper',
        entityType: 'contact',
        isPrimary: true,
        contact: contacts[1],
      }),
    ]);
  });

  test.each([
    [{ label: 'Authorize', uri: 'https://example.com/oauth' }, true],
    [{ label: 'Authorize', uri: 'http://example.com/oauth' }, true],
    [{ label: 3, uri: 'https://example.com' }, false],
    [{ label: 'Authorize', uri: 3 }, false],
    [{ label: 'Authorize', uri: '/oauth' }, false],
    [{ label: 'Authorize', uri: 'https://example.com/javascript:alert(1)' }, false],
  ])('validates authorization link %j', (link, expected) => {
    expect(isSafeAuthorizationLink(link)).toBe(expected);
  });
});
