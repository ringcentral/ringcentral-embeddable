import searchContactPhoneNumbers from '../../src/lib/searchContactPhoneNumbers';

describe('searchContactPhoneNumbers', () => {
  it('returns contact phone numbers matched by name', () => {
    const contacts = [
      {
        id: '101',
        firstName: 'Ada',
        lastName: 'Lovelace',
        type: 'company',
        phoneNumbers: [
          {
            phoneNumber: '+16505550101',
            phoneType: 'businessPhone',
          },
          {
            phoneNumber: '+16505550102',
            phoneType: 'mobilePhone',
          },
        ],
      },
      {
        id: '102',
        name: 'Grace Hopper',
        type: 'personal',
        phoneNumbers: [
          {
            phoneNumber: '+16505550103',
            phoneType: 'homePhone',
          },
        ],
      },
    ];

    const result = searchContactPhoneNumbers(contacts, 'ada');

    expect(result).toEqual([
      {
        id: '101+16505550101',
        name: 'Ada Lovelace',
        type: 'company',
        phoneNumber: '+16505550101',
        phoneType: 'business',
        entityType: 'contact',
        contactId: '101',
      },
      {
        id: '101+16505550102',
        name: 'Ada Lovelace',
        type: 'company',
        phoneNumber: '+16505550102',
        phoneType: 'mobile',
        entityType: 'contact',
        contactId: '101',
      },
    ]);
  });

  it('returns contact phone numbers matched by phone number', () => {
    const contacts = [
      {
        id: '101',
        firstName: 'Ada',
        lastName: 'Lovelace',
        type: 'company',
        phoneNumbers: [
          {
            phoneNumber: '+16505550101',
            phoneType: 'businessPhone',
          },
        ],
      },
    ];

    const result = searchContactPhoneNumbers(contacts, '0101', 'lead');

    expect(result).toEqual([
      {
        id: '101+16505550101',
        name: 'Ada Lovelace',
        type: 'company',
        phoneNumber: '+16505550101',
        phoneType: 'business',
        entityType: 'lead',
        contactId: '101',
      },
    ]);
  });
});
