import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { ModalView } from '@ringcentral-integration/micro-core/src/app/views';
import { SmsTemplate } from '@ringcentral-integration/micro-message/src/app/services';
import { SmsTemplateView as SmsTemplateViewBase } from '@ringcentral-integration/micro-message/src/app/views/SmsTemplateView';
import type {
  SmsTemplateViewOptions,
  SmsTemplateViewProps,
} from '@ringcentral-integration/micro-message/src/app/views/SmsTemplateView';
import {
  injectable,
  optional,
  useConnector,
} from '@ringcentral-integration/next-core';
import type React from 'react';

import type { AppFeatures as EmbeddableAppFeatures } from '../../services/AppFeatures';

/**
 * The SMS template button, shown only when `enableSMSTemplate` is on and the
 * account can use templates, as in 3.x.
 */
@injectable({
  name: 'SmsTemplateView',
})
export class SmsTemplateView extends SmsTemplateViewBase {
  constructor(
    modalView: ModalView,
    smsTemplate: SmsTemplate,
    toast: Toast,
    private readonly _appFeatures: AppFeatures,
    @optional('SmsTemplateViewOptions')
    smsTemplateViewOptions?: SmsTemplateViewOptions,
  ) {
    super(modalView, smsTemplate, toast, smsTemplateViewOptions);
  }

  override component(props: SmsTemplateViewProps): React.ReactElement | null {
    // The base hooks run on every render, so toggling the feature keeps the
    // hook order stable.
    const element = super.component(props);
    const show = useConnector(
      () => (this._appFeatures as EmbeddableAppFeatures).showSmsTemplate,
    );
    return show ? element : null;
  }
}
