import { ModalView } from '@ringcentral-integration/micro-core/src/app/views';
import type { ToNumber } from '@ringcentral-integration/micro-message/src/app/services';
import type { Recipient } from '@ringcentral-integration/micro-phone/src/app/services';
import { injectable, portal, RcModule } from '@ringcentral-integration/next-core';

import { ThirdParty } from '../ThirdParty';
import type {
  DoNotContactRecipient,
  DoNotContactRequest,
  DoNotContactResponse,
} from '../ThirdParty';

type DialerRecipient = Recipient & {
  contactId?: string;
  entityType?: string;
  phoneType?: string;
};

type SmsRecipient = ToNumber & {
  contactId?: string;
};

type DoNotContactModalPayload = {
  header: string;
  content: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  variant: 'alert' | 'confirm';
  dataSign: string;
};

type CallVerification = {
  phoneNumber?: string;
  recipient?: DialerRecipient;
};

type SmsVerification = {
  toNumbers: SmsRecipient[];
  typingToNumber?: string;
};

const CALL_TITLE = 'Do Not Call';
const SMS_TITLE = 'Do Not Contact';

/** Enforces a registered third-party Do Not Contact policy for calls and SMS. */
@injectable({
  name: 'DoNotContact',
})
export class DoNotContact extends RcModule {
  constructor(private _thirdParty: ThirdParty, private _modalView: ModalView) {
    super();
  }

  @portal
  private _warningModal = this._modalView.create<DoNotContactModalPayload>({
    props: (data) => ({
      header: data.header,
      content: data.content,
      confirmButtonText: data.confirmButtonText,
      cancelButtonText: data.cancelButtonText,
      variant: data.variant,
      ['data-sign']: data.dataSign,
    }),
  });

  /** Checks whether an outbound call may continue. */
  async verifyCall({ phoneNumber, recipient }: CallVerification): Promise<boolean> {
    const targetNumber = phoneNumber || recipient?.phoneNumber;
    if (!targetNumber) {
      return true;
    }
    const request: DoNotContactRequest = recipient
      ? {
          phoneNumber: targetNumber,
          contactId: recipient.contactId || recipient.id,
          name: recipient.name,
          contactType: recipient.type,
          entityType: recipient.entityType,
          phoneType: recipient.phoneType,
          actionType: 'call',
        }
      : {
          phoneNumber: targetNumber,
          actionType: 'call',
        };
    return this._verify(request, {
      header: CALL_TITLE,
      restrictedContent: 'This number is on the Do Not Call list.',
      warningContent: 'This number is on the Do Not Call list. Do you still want to call?',
      confirmButtonText: 'Call',
      dataSign: 'doNotCallModal',
    });
  }

  /** Checks whether a new outbound SMS may continue. */
  async verifySms({ toNumbers, typingToNumber = '' }: SmsVerification): Promise<boolean> {
    const recipients = toNumbers.map((item) => this._toSmsRecipient(item));
    if (typingToNumber) {
      recipients.push({ phoneNumber: typingToNumber });
    }
    return this.verifySmsRecipients(recipients);
  }

  /** Checks whether an outbound SMS to the supplied recipients may continue. */
  async verifySmsRecipients(recipients: DoNotContactRecipient[]): Promise<boolean> {
    if (recipients.length === 0) {
      return true;
    }
    return this._verify(
      {
        recipients,
        actionType: 'sms',
      },
      {
        header: SMS_TITLE,
        restrictedContent: 'The number is on the Do Not Contact list.',
        warningContent:
          'The number is on the Do Not Contact list. Do you still want to send message?',
        confirmButtonText: 'Send',
        dataSign: 'doNotSmsModal',
      },
    );
  }

  private _toSmsRecipient(item: SmsRecipient): DoNotContactRecipient {
    return {
      phoneNumber: item.phoneNumber,
      phoneType: item.phoneType,
      contactId: item.contactId || item.id,
      name: item.name,
      contactType: item.type,
      entityType: item.entityType,
    };
  }

  private async _verify(
    request: DoNotContactRequest,
    options: {
      header: string;
      restrictedContent: string;
      warningContent: string;
      confirmButtonText: string;
      dataSign: string;
    },
  ): Promise<boolean> {
    if (!this._thirdParty.doNotContactRegistered) {
      return true;
    }
    try {
      const response = await this._thirdParty.checkDoNotContact(request);
      if (!response || !response.result) {
        return true;
      }
      return this._showWarning(response, options);
    } catch (error) {
      this.logger.error('Failed to check the Do Not Contact policy', error);
      return true;
    }
  }

  private async _showWarning(
    response: DoNotContactResponse,
    options: {
      header: string;
      restrictedContent: string;
      warningContent: string;
      confirmButtonText: string;
      dataSign: string;
    },
  ): Promise<boolean> {
    const isRestricted = response.mode === 'restrict';
    const { closed } = this._modalView.open(this._warningModal, {
      header: options.header,
      content:
        response.message || (isRestricted ? options.restrictedContent : options.warningContent),
      confirmButtonText: isRestricted ? 'OK' : options.confirmButtonText,
      cancelButtonText: isRestricted ? undefined : 'Cancel',
      variant: isRestricted ? 'alert' : 'confirm',
      dataSign: options.dataSign,
    });
    if (isRestricted) {
      return false;
    }
    return Boolean(await closed);
  }
}
