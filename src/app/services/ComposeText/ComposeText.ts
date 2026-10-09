import { AppFeatures, Auth } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  ContactMatcher,
  ContactSearch,
  NumberValidate,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  type Attachment,
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
import {
  COMPOSE_TYPING_CONTEXT,
  SmsTypingTimeTracker,
} from '../SmsTypingTimeTracker';

/**
 * Adds third-party Do Not SMS verification and SMS typing time tracking to
 * message composition.
 */
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
    @optional()
    private readonly _smsTypingTimeTracker?: SmsTypingTimeTracker,
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

  override async updateMessageText(text: string): Promise<void> {
    await super.updateMessageText(text);
    if (text) {
      await this._smsTypingTimeTracker?.startTyping(COMPOSE_TYPING_CONTEXT);
      return;
    }
    // An emptied draft discards the typing session, as on the legacy page.
    await this._smsTypingTimeTracker?.clearTyping(COMPOSE_TYPING_CONTEXT);
  }

  override async send(
    text: string,
    attachments: Attachment[] = [],
  ): ReturnType<BaseComposeText['send']> {
    // Stop counting while sending, so a blocked or failed send stays paused.
    await this._smsTypingTimeTracker?.pauseTyping(COMPOSE_TYPING_CONTEXT);
    const responses = await super.send(text, attachments);
    const messageIds = (responses ?? [])
      .map((response) => response?.id)
      .filter((id) => id !== undefined && id !== null)
      .map(String);
    if (messageIds.length > 0) {
      // A group text gets the same typing time on every sent message.
      await this._smsTypingTimeTracker?.stopTypingForMessages(
        COMPOSE_TYPING_CONTEXT,
        messageIds,
      );
    }
    return responses;
  }

  override async clean(): Promise<void> {
    this._requestedRecipients = [];
    await this._smsTypingTimeTracker?.clearTyping(COMPOSE_TYPING_CONTEXT);
    return super.clean();
  }

  private _requestRecipients(numbers: ToNumber[]): void {
    this._requestedRecipients = [
      ...this._requestedRecipients,
      ...numbers.filter(({ phoneNumber }) => Boolean(phoneNumber?.trim())),
    ];
  }
}
