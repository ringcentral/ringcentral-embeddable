/* eslint-disable react-hooks/rules-of-hooks */
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  SyncTabProps,
  SyncTabView,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  computed,
  injectable,
  RcViewModule,
  UIFunctions,
  UIProps,
  useConnector,
} from '@ringcentral-integration/next-core';
import clsx from 'clsx';
import React, { useRef } from 'react';

import { MeetingHistoryView } from './MeetingHistoryView';
import { MeetingHomeView } from './MeetingHomeView';
import i18n, { t } from './i18n';

const MEETING_TAB_ID = 'meetingTabs';

interface MeetingViewPanelProps {
  tabs: SyncTabProps['tabs'];
}

@injectable({
  name: 'MeetingView',
})
export class MeetingView extends RcViewModule {
  constructor(
    protected _syncTabView: SyncTabView,
    protected _meetingHomeView: MeetingHomeView,
    protected _meetingHistoryView: MeetingHistoryView,
  ) {
    super();
  }

  @computed
  get tabs(): SyncTabProps['tabs'] {
    return [
      {
        id: 'upcoming',
        label: t('upcomingMeetings'),
        component: <this._meetingHomeView.component />,
      },
      {
        id: 'history',
        label: t('pastMeetings'),
        component: <this._meetingHistoryView.component />,
      },
      {
        id: 'recordings',
        label: t('recordings'),
        component: <this._meetingHistoryView.component type="recordings" />,
      },
    ];
  }

  getUIProps(): UIProps<MeetingViewPanelProps> {
    return {
      tabs: this.tabs,
    };
  }

  getUIFunctions(): UIFunctions<MeetingViewPanelProps> {
    return {};
  }

  component() {
    const { t: tLocale } = useLocale(i18n);
    const { current: _uiFunctions } = useRef(this.getUIFunctions());

    const { tabs } = useConnector(() => this.getUIProps());

    return tabs.length > 0 ? (
      <>
        <AppHeaderNav title={tLocale('video')}>
          <></>
        </AppHeaderNav>
        <this._syncTabView.component
          id={MEETING_TAB_ID}
          className={clsx('[&_.sui-tab]:max-w-none [&_.sui-tab]:flex-grow')}
          variant="scrollable"
          tabs={tabs}
        />
      </>
    ) : null;
  }
}
