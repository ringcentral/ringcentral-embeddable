import { DoNotContact } from '../../src/app/services/DoNotContact/DoNotContact';

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
}));

function createService({ response = false, registered = true, closed = true } = {}) {
  const thirdParty = {
    doNotContactRegistered: registered,
    checkDoNotContact: jest.fn(async () => response),
  };
  const modalView = {
    create: jest.fn((options) => options),
    open: jest.fn(() => ({ closed: Promise.resolve(closed) })),
  };
  return {
    modalView,
    service: new DoNotContact(thirdParty, modalView),
    thirdParty,
  };
}

describe('DoNotContact service', () => {
  test('skips checks when no third-party policy is registered', async () => {
    const { modalView, service, thirdParty } = createService({
      registered: false,
    });

    await expect(service.verifyCall({ phoneNumber: '+16505550100' })).resolves.toBe(true);
    expect(thirdParty.checkDoNotContact).not.toHaveBeenCalled();
    expect(modalView.open).not.toHaveBeenCalled();
  });

  test('blocks a restricted call and preserves selected-contact metadata', async () => {
    const { modalView, service, thirdParty } = createService({
      response: {
        result: true,
        mode: 'restrict',
        message: 'Calls are disabled for this contact.',
      },
    });

    await expect(
      service.verifyCall({
        recipient: {
          phoneNumber: '+16505550100',
          id: 'contact-1',
          name: 'Ada',
          type: 'Lead',
          entityType: 'crm',
          phoneType: 'work',
        },
      }),
    ).resolves.toBe(false);
    expect(thirdParty.checkDoNotContact).toHaveBeenCalledWith({
      actionType: 'call',
      phoneNumber: '+16505550100',
      contactId: 'contact-1',
      name: 'Ada',
      contactType: 'Lead',
      entityType: 'crm',
      phoneType: 'work',
    });
    expect(modalView.open.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        content: 'Calls are disabled for this contact.',
        variant: 'alert',
      }),
    );
  });

  test('allows an override after the user confirms the SMS warning', async () => {
    const { modalView, service, thirdParty } = createService({
      response: { result: true },
      closed: true,
    });

    await expect(
      service.verifySms({
        toNumbers: [
          {
            id: 'contact-2',
            phoneNumber: '+16505550101',
            name: 'Grace',
            type: 'Contact',
            phoneType: 'mobile',
          },
        ],
        typingToNumber: '+16505550102',
      }),
    ).resolves.toBe(true);
    expect(thirdParty.checkDoNotContact).toHaveBeenCalledWith({
      actionType: 'sms',
      recipients: [
        {
          phoneNumber: '+16505550101',
          phoneType: 'mobile',
          contactId: 'contact-2',
          name: 'Grace',
          contactType: 'Contact',
          entityType: undefined,
        },
        { phoneNumber: '+16505550102' },
      ],
    });
    expect(modalView.open.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        confirmButtonText: 'Send',
        variant: 'confirm',
      }),
    );
  });

  test('fails open when the host check throws', async () => {
    const { modalView, service, thirdParty } = createService();
    thirdParty.checkDoNotContact.mockRejectedValueOnce(new Error('host unavailable'));

    await expect(service.verifySmsRecipients([{ phoneNumber: '+16505550103' }])).resolves.toBe(
      true,
    );
    expect(service.logger.error).toHaveBeenCalledWith(
      'Failed to check the Do Not Contact policy',
      expect.any(Error),
    );
    expect(modalView.open).not.toHaveBeenCalled();
  });
});
