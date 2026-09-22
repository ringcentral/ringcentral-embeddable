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
}
