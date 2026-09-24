import { AppFeatures, Auth } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  ContactMatcher,
  ContactSearch,
  NumberValidate,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  ComposeText as BaseComposeText,
  type ComposeTextOptions,
  MessageSender,
  SmsConsent,
  SmsOptOut,
  type ToNumber,
} from '@ringcentral-integration/micro-message/src/app/services';
import {
  injectable,
  optional,
  RouterPlugin,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import { DoNotContact } from '../DoNotContact';

/** Adds third-party Do Not SMS verification to message composition. */
@injectable({
  name: 'ComposeText',
})
export class ComposeText extends BaseComposeText {
  constructor(
    protected override _toast: Toast,
    protected override _auth: Auth,
    protected override _storage: StoragePlugin,
    protected override _messageSender: MessageSender,
    protected override _numberValidate: NumberValidate,
    protected override _appFeatures: AppFeatures,
    private _doNotContact: DoNotContact,
    @optional() protected override _contactMatcher?: ContactMatcher,
    @optional() protected override _smsOptOut?: SmsOptOut,
    @optional() protected override _contactSearch?: ContactSearch,
    @optional('ComposeTextOptions')
    protected override _composeTextOptions?: ComposeTextOptions,
    @optional() protected override _router?: RouterPlugin,
    @optional() protected override _smsConsent?: SmsConsent,
  ) {
    super(
      _toast,
      _auth,
      _storage,
      _messageSender,
      _numberValidate,
      _appFeatures,
      _contactMatcher,
      _smsOptOut,
      _contactSearch,
      _composeTextOptions,
      _router,
      _smsConsent,
    );
  }

  protected override smsVerify = (options: {
    toNumbers: ToNumber[];
    typingToNumber: string;
  }): Promise<boolean> => this._doNotContact.verifySms(options);

  /**
   * Recipients requested for the current message, recorded as soon as they
   * are requested. Adding a recipient validates its number first, so a
   * click-to-SMS opens the compose page before the recipient is in
   * `toNumbers`.
   */
  private _requestedRecipients: ToNumber[] = [];

  /**
   * The first recipient of the message being composed, including one still
   * being validated, or null for a message without a recipient.
   */
  get requestedRecipient(): ToNumber | null {
    return this.toNumbers[0] ?? this._requestedRecipients[0] ?? null;
  }

  override async addToNumber(number: ToNumber): Promise<boolean> {
    this._requestRecipients([number]);
    return super.addToNumber(number);
  }

  override async addToNumbers(numbers: ToNumber[]): Promise<boolean> {
    this._requestRecipients(numbers ?? []);
    return super.addToNumbers(numbers);
  }

  override async clean(): Promise<void> {
    this._requestedRecipients = [];
    return super.clean();
  }

  private _requestRecipients(numbers: ToNumber[]): void {
    this._requestedRecipients = [
      ...this._requestedRecipients,
      ...numbers.filter(({ phoneNumber }) => Boolean(phoneNumber?.trim())),
    ];
  }
}
