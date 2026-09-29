import {
  injectable,
  RcViewModule,
  RouterPlugin,
  type RouteComponentProps,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import { ThirdParty } from '../../services/ThirdParty';
import type { UnknownRecord } from '../../services/ThirdParty/ThirdParty.interface';

import { CustomizedPagePanel } from './CustomizedPagePanel';

@injectable({
  name: 'CustomizedPageView',
})
export class CustomizedPageView extends RcViewModule {
  constructor(
    private _thirdParty: ThirdParty,
    private _router: RouterPlugin,
  ) {
    super();
  }

  /** The title the host registered for a customized page. */
  getPageTitle(pageId: string): string | undefined {
    return this._thirdParty.getCustomizedPage(pageId)?.title || undefined;
  }

  component({
    match,
  }: RouteComponentProps<{ pageId: string }>): React.ReactElement | null {
    const pageId = match.params.pageId;
    const page = useConnector(() =>
      this._thirdParty.getCustomizedPage(pageId),
    );
    const { current: uiFunctions } = useRef({
      onBack: () => this._router.goBack(),
      onButtonClick: (buttonId: string, formData: UnknownRecord) => {
        void this._thirdParty.onClickButtonInCustomizedPage(
          buttonId,
          'button',
          formData,
        );
      },
      onFormDataChange: (
        id: string,
        formData: UnknownRecord,
        changedKeys: string[],
      ) => {
        void this._thirdParty.onCustomizedPageInputChanged({
          pageId: id,
          formData,
          keys: changedKeys,
        });
      },
      onSubmit: (id: string, formData: UnknownRecord) => {
        void this._thirdParty.onClickButtonInCustomizedPage(
          id,
          'submit',
          formData,
        );
      },
      onTabActionClick: (tabId: string, actionId: string) => {
        void this._thirdParty.onClickCustomizedTabAction(tabId, actionId);
      },
    });

    if (!page) {
      return null;
    }

    return <CustomizedPagePanel page={page} {...uiFunctions} />;
  }
}
