import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services';
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  SyncTabProps,
  SyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views';
import { MessageStore } from '@ringcentral-integration/micro-message/src/app/services';
import { ConversationsViewSpring } from '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring';
import { CallHistory } from '@ringcentral-integration/micro-phone/src/app/services';
import { CallsListViewSpring } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring';
import { DialerView } from '@ringcentral-integration/micro-phone/src/app/views/DialerView';
import {
  DialerPadView as DialerPadViewBase,
} from '@ringcentral-integration/micro-phone/src/app/views/DialerPadView';
import type {
  DialerPadViewOptions,
} from '@ringcentral-integration/micro-phone/src/app/views/DialerPadView/DialerPad.view.interface';
import {
  autobind,
  computed,
  injectable,
  optional,
  Root,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import { CollapseLeftMd, CollapseRightMd, Hudmd } from '@ringcentral/spring-icon';
import { IconButton } from '@ringcentral/spring-ui';
import React from 'react';

import { CallHUDView } from '../CallHUDView';

import i18n from './i18n';

@injectable({
  name: 'DialerPadView',
})
export class DialerPadView extends DialerPadViewBase {
  constructor(
    protected _router: RouterPlugin,
    protected _appFeatures: AppFeatures,
    protected _messageStore: MessageStore,
    protected _callHistory: CallHistory,
    protected _syncTabView: SyncTabView,
    protected _callsListView: CallsListViewSpring,
    protected _dialerView: DialerView,
    protected _conversationsView: ConversationsViewSpring,
    protected _root: Root,
    protected _callHUDView: CallHUDView,
    @optional('DialerPadViewOptions')
    protected _dialerPadViewOptions?: DialerPadViewOptions,
  ) {
    super(
      _router,
      _appFeatures,
      _messageStore,
      _callHistory,
      _syncTabView,
      _callsListView,
      _dialerView,
      _conversationsView,
      _dialerPadViewOptions,
    );
  }

  private toggleExpanded = () => {
    this._root.setExpanded(!this._root.expanded);
  };

  private toggleCallHUD = () => {
    this._callHUDView.toggleCallHUD();
  };

  /**
   * Renders an `AppHeaderNav` with the expand/collapse icon button.
   *
   * The nav state in `AppContext` is single-slot: the last `AppHeaderNav`
   * whose effect runs wins. Rendering this as the last sibling inside each
   * tab panel guarantees its `useLayoutEffect` runs after any
   * `AppHeaderNav` mounted by the tab's own content, so the expand button
   * stays visible when the user switches tabs.
   */
  @autobind
  private ExpandHeader() {
    const { t } = useLocale(i18n);
    const expanded = useConnector(() => this._root.expanded);
    const hasHUDPermission = useConnector(
      () => (this._appFeatures as any).hasHUDPermission,
    );
    const showCallHUD = useConnector(() => this._callHUDView.showCallHUD);

    return (
      <AppHeaderNav title={t('phone')}>
        {hasHUDPermission && (
          <IconButton
            variant="icon"
            color={showCallHUD ? 'primary' : 'secondary'}
            size="medium"
            symbol={Hudmd}
            data-sign="toggleCallHUD"
            TooltipProps={{ title: t('callHUD') }}
            onClick={this.toggleCallHUD}
          />
        )}
        <IconButton
          variant="icon"
          color="secondary"
          size="medium"
          symbol={expanded ? CollapseLeftMd : CollapseRightMd}
          data-sign="toggleExpanded"
          data-expanded={expanded ? 'unfolded' : 'folded'}
          TooltipProps={{
            title: expanded ? t('collapse') : t('expand'),
          }}
          onClick={this.toggleExpanded}
        />
      </AppHeaderNav>
    );
  }

  @autobind
  private CallHUDContent() {
    return this._callHUDView.component();
  }

  @computed
  override get tabs(): SyncTabProps['tabs'] {
    return super.tabs.map((tab) => ({
      ...tab,
      component: (
        <>
          {tab.component}
          <this.ExpandHeader />
          <this.CallHUDContent />
        </>
      ),
    }));
  }
}
