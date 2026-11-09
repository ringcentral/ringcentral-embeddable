import { CALLING_ROUTE_PATH } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  autobind,
  delegate,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  type RouteComponentProps,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import { t } from '../../i18n';
import { ThirdParty } from '../../services/ThirdParty';
import type { UnknownRecord } from '../../services/ThirdParty/ThirdParty.interface';
import { type SideWidgetContentHandle, SideWidgetView } from '../SideWidgetView';

import { CustomizedPagePanel } from './CustomizedPagePanel';

const CUSTOMIZED_PAGE_PATH_PREFIX = '/customized/';

@injectable({
  name: 'CustomizedPageView',
})
export class CustomizedPageView extends RcViewModule {
  /** The customized page id shown in the tab opened from the call page. */
  @state
  private _callPagePageId: string | null = null;

  private readonly _callPageHandle: SideWidgetContentHandle | null;

  constructor(
    private _thirdParty: ThirdParty,
    private _router: RouterPlugin,
    @optional() private _sideWidgetView?: SideWidgetView,
  ) {
    super();
    this._callPageHandle =
      this._sideWidgetView?.createContent({
        id: 'call-page-customized-page',
        name: t('page'),
        getName: () =>
          (this._callPagePageId &&
            this.getPageTitle(this._callPagePageId)) ||
          t('page'),
        // A host page is not about a contact, so a call does not close it.
        scope: 'global',
        onBack: () => this._closeCallPagePage(),
        onClose: () => this._setCallPagePageId(null),
        view: this.CallPageCustomizedPage,
      }) ?? null;
  }

  /** The title the host registered for a customized page. */
  getPageTitle(pageId: string): string | undefined {
    return this._thirdParty.getCustomizedPage(pageId)?.title || undefined;
  }

  /**
   * Opens a customized page path, such as `/customized/<pageId>`.
   *
   * Leaving the call page closes the call on it and shows the dialer in the
   * main column, so from the call page the customized page opens in the side
   * widget while the call page stays in the main column.
   *
   * @returns Whether the path was a customized page.
   */
  @delegate('server')
  async openCustomizedPage(path: string): Promise<boolean> {
    const pageId = getCustomizedPageId(path);
    if (!pageId) {
      return false;
    }
    if (
      this._callPageHandle &&
      this._router.currentPath === CALLING_ROUTE_PATH
    ) {
      this._setCallPagePageId(pageId);
      this._sideWidgetView!.openContent(this._callPageHandle);
      return true;
    }
    this._closeCallPagePage();
    if (this._router.currentPath !== path) {
      await this._router.push(path);
    }
    return true;
  }

  /**
   * Closes the customized page opened from the call page, as the host's
   * `goBack` navigation asks. Going back in the router would leave the call
   * page instead.
   *
   * @returns Whether a customized page was open over the call page.
   */
  @delegate('server')
  async closeCallPageCustomizedPage(): Promise<boolean> {
    if (
      !this._callPagePageId ||
      this._router.currentPath !== CALLING_ROUTE_PATH
    ) {
      return false;
    }
    this._closeCallPagePage();
    return true;
  }

  @action
  private _setCallPagePageId(pageId: string | null): void {
    this._callPagePageId = pageId;
  }

  /** The routed customized page replaces the call page's tab. */
  private _closeCallPagePage(): void {
    if (this._callPageHandle && this._callPagePageId) {
      void this._sideWidgetView!.closeTabFromPanel(
        this._callPageHandle.options.id,
      );
    }
  }

  /** Renders the call page's customized page without routing to it. */
  @autobind
  private CallPageCustomizedPage(): React.ReactElement | null {
    const pageId = useConnector(() => this._callPagePageId);
    if (!pageId) {
      return null;
    }
    return (
      <this.CustomizedPage
        pageId={pageId}
        onBack={() => this._closeCallPagePage()}
      />
    );
  }

  @autobind
  private CustomizedPage({
    pageId,
    onBack,
  }: {
    pageId: string;
    onBack: () => void;
  }): React.ReactElement | null {
    const page = useConnector(() =>
      this._thirdParty.getCustomizedPage(pageId),
    );
    const onBackRef = useRef(onBack);
    onBackRef.current = onBack;
    const { current: uiFunctions } = useRef({
      onBack: () => onBackRef.current(),
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

  component({
    match,
  }: RouteComponentProps<{ pageId: string }>): React.ReactElement | null {
    return (
      <this.CustomizedPage
        pageId={match.params.pageId}
        onBack={() => this._router.goBack()}
      />
    );
  }
}

/** The page id of a `/customized/<pageId>` path, ignoring any query. */
function getCustomizedPageId(path: string): string | null {
  const [pathname] = path.split('?');
  if (!pathname.startsWith(CUSTOMIZED_PAGE_PATH_PREFIX)) {
    return null;
  }
  const pageId = pathname.slice(CUSTOMIZED_PAGE_PATH_PREFIX.length);
  return pageId && !pageId.includes('/') ? decodeURIComponent(pageId) : null;
}
