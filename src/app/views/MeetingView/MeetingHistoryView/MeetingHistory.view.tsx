/* eslint-disable react-hooks/rules-of-hooks */
import {
  SearchInputToggle,
} from '@ringcentral-integration/micro-message/src/app/components';
import type { ChangeEvent } from 'react';
import {
  action,
  injectable,
  RcViewModule,
  RouterPlugin,
  state,
  UIFunctions,
  UIProps,
  useConnector,
} from '@ringcentral-integration/next-core';
import { Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import React, { useEffect, useRef, useState } from 'react';
import { RecentMd } from '@ringcentral/spring-icon';
import {
  CircularProgressIndicator,
  EmptyState,
  List,
} from '@ringcentral/spring-ui';

import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services';
import { MeetingItem, type MeetingHistoryItem } from './components/MeetingItem';
import i18n from './i18n';

interface MeetingHistoryViewProps {
  type?: string;
}

interface MeetingHistoryPanelProps {
  isReady: boolean;
  meetings: MeetingHistoryItem[];
  currentLocale: string;
  fetching: boolean;
  pageToken: string | null;
  searchText: string;
  onFetchHistory: (type: string, pageToken?: string) => Promise<void>;
  onUpdateSearchText: (text: string, type: string) => void;
  onMeetingClick: (meetingId: string) => void;
  formatDateTime: (startTime: string, currentLocale: string) => string;
}

interface FetchHistoryMeetingsParams {
  readonly pageToken?: string;
  readonly searchText?: string;
  readonly type?: string;
}

interface FetchHistoryMeetingsResult {
  readonly paging?: {
    readonly nextPageToken?: string | null;
  };
}

interface GenericMeetingWithHistoryDeps extends GenericMeeting {
  readonly historyMeetings: MeetingHistoryItem[];
  fetchHistoryMeetings(
    params: FetchHistoryMeetingsParams,
  ): Promise<FetchHistoryMeetingsResult | null>;
}

const NO_NEXT_PAGE = 'noNext';

@injectable({
  name: 'MeetingHistoryView',
})
export class MeetingHistoryView extends RcViewModule {
  private _fetchType: string = '';
  private _searchTimer: ReturnType<typeof setTimeout> | null = null;

  private get _genericMeetingWithHistory(): GenericMeetingWithHistoryDeps {
    return this._genericMeeting as GenericMeetingWithHistoryDeps;
  }

  constructor(
    private _genericMeeting: GenericMeeting,
    private _router: RouterPlugin,
    private _locale: Locale,
  ) {
    super();
  }

  @state
  fetching: boolean = false;

  @state
  pageToken: string | null = null;

  @state
  searchText: string = '';

  @action
  private _updateSearchText(text: string): void {
    this.searchText = text;
    this.pageToken = null;
  }

  @action
  private _onFetchStart(pageToken: string | null): void {
    this.fetching = true;
    this.pageToken = pageToken ?? null;
  }

  @action
  private _onFetchSuccess(nextPageToken: string | null): void {
    this.fetching = false;
    this.pageToken = nextPageToken;
  }

  @action
  private _onFetchError(): void {
    this.fetching = false;
  }

  getUIProps(): UIProps<MeetingHistoryPanelProps> {
    return {
      isReady: this._genericMeeting.ready && this._locale.ready,
      meetings: this._genericMeetingWithHistory.historyMeetings ?? [],
      currentLocale: this._locale.currentLocale,
      fetching: this.fetching,
      pageToken: this.pageToken,
      searchText: this.searchText,
    };
  }

  getUIFunctions(): UIFunctions<MeetingHistoryPanelProps> {
    return {
      onFetchHistory: async (type: string, pageToken?: string): Promise<void> => {
        if (this.fetching && this._fetchType === type) return;
        if (pageToken === NO_NEXT_PAGE) return;
        this._fetchType = type;
        this._onFetchStart(pageToken ?? null);
        try {
          const result = await this._genericMeetingWithHistory.fetchHistoryMeetings({
            pageToken,
            searchText: this.searchText,
            type,
          });
          this._onFetchSuccess(result?.paging?.nextPageToken ?? NO_NEXT_PAGE);
        } catch (err) {
          console.error(err);
          this._onFetchError();
        }
      },
      onUpdateSearchText: (text: string, type: string): void => {
        this._updateSearchText(text);
        if (this._searchTimer) clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
          this.getUIFunctions().onFetchHistory(type);
        }, 300);
      },
      onMeetingClick: (meetingId: string): void => {
        window.open(
          `https://v.ringcentral.com/welcome/meetings/recordings/recording/${meetingId}`,
        );
      },
      formatDateTime: (startTime: string, currentLocale: string): string => {
        try {
          return new Date(startTime).toLocaleString(currentLocale, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          return startTime;
        }
      },
    };
  }

  component(props: MeetingHistoryViewProps) {
    const { t } = useLocale(i18n);
    const type = props?.type ?? 'meetings';
    const { current: uiFunctions } = useRef(this.getUIFunctions());

    const { isReady, meetings, currentLocale, fetching, pageToken, searchText } =
      useConnector(() => this.getUIProps());

    const scrollRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (isReady) {
        uiFunctions.onFetchHistory(type);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isReady, type]);

    const handleScroll = (): void => {
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (isNearBottom && !fetching && pageToken && pageToken !== NO_NEXT_PAGE) {
        uiFunctions.onFetchHistory(type, pageToken);
      }
    };

    const showInitialSpinner = !isReady || (fetching && !pageToken);
    const showLoadMoreSpinner = fetching && !!pageToken;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="border-b border-neutral-l01">
          <div className="flex px-3 py-1 items-center gap-2">
            <div className="flex-auto">
              <SearchInputToggle
                searchInput={searchText || ''}
                onSearchInputChange={(e: ChangeEvent<HTMLInputElement>) => {
                  uiFunctions.onUpdateSearchText(e.target.value, type);
                }}
                placeholder={t('search')}
                data-sign="meetingHistorySearch"
                alwaysExpanded
              />
            </div>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {showInitialSpinner ? (
            <div className="flex items-center justify-center h-full">
              <CircularProgressIndicator
                size="large"
                color="primary"
                data-sign="meetingHistoryLoading"
              />
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <EmptyState
                icon={RecentMd}
                title={t('noMeetings')}
                data-sign="meetingHistoryEmptyState"
              />
            </div>
          ) : (
            <List className="py-1">
              {meetings.map((meeting) => (
                <MeetingItem
                  key={meeting.id}
                  meeting={meeting}
                  type={type}
                  divider={meetings.length > 1 && meeting.id !== meetings[meetings.length - 1]?.id}
                  onClick={uiFunctions.onMeetingClick}
                  formatDateTime={(t) => uiFunctions.formatDateTime(t, currentLocale)}
                  t={t}
                />
              ))}
            </List>
          )}
          {showLoadMoreSpinner ? (
            <div className="flex justify-center py-2">
              <CircularProgressIndicator size="small" color="primary" />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
