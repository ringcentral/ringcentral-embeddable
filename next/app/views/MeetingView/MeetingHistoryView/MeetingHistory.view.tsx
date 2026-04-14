/* eslint-disable react-hooks/rules-of-hooks */
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
import React, { useEffect, useRef } from 'react';
import { RecentMd } from '@ringcentral/spring-icon';

import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services/GenericMeeting';
import { MeetingItem } from './components/MeetingItem';
import i18n from './i18n';

interface HistoryMeeting {
  id: string;
  topic?: string;
  name?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  hasRecording?: boolean;
}

interface MeetingHistoryViewProps {
  type?: string;
}

interface MeetingHistoryPanelProps {
  isReady: boolean;
  meetings: HistoryMeeting[];
  currentLocale: string;
  fetching: boolean;
  pageToken: string | null;
  searchText: string;
  onFetchHistory: (type: string, pageToken?: string) => Promise<void>;
  onUpdateSearchText: (text: string, type: string) => void;
  onMeetingClick: (meetingId: string) => void;
  formatDateTime: (startTime: string, currentLocale: string) => string;
}

const NO_NEXT_PAGE = 'noNext';

@injectable({
  name: 'MeetingHistoryView',
})
export class MeetingHistoryView extends RcViewModule {
  private _fetchType: string = '';
  private _searchTimer: ReturnType<typeof setTimeout> | null = null;

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
      meetings: (this._genericMeeting.historyMeetings as HistoryMeeting[]) ?? [],
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
          const result = (await this._genericMeeting.fetchHistoryMeetings({
            pageToken,
            searchText: this.searchText,
            type,
          })) as any;
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
        <div className="px-4 py-2 border-b border-neutral-l01">
          <input
            type="search"
            className="w-full border border-neutral-l02 rounded-lg px-3 py-2 text-body2 text-neutral-f06 focus:outline-none focus:ring-2 focus:ring-interactive-b01 bg-neutral-b01"
            placeholder={t('search')}
            value={searchText}
            onChange={(e) => uiFunctions.onUpdateSearchText(e.target.value, type)}
            data-sign="meetingHistorySearch"
          />
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          {showInitialSpinner ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-interactive-b01 border-t-transparent" />
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-neutral-f03">
              <RecentMd className="w-12 h-12 opacity-40" />
              <p className="text-body2">{t('noMeetings')}</p>
            </div>
          ) : (
            <ul className="list-none p-0 m-0">
              {meetings.map((meeting) => (
                <MeetingItem
                  key={meeting.id}
                  meeting={meeting}
                  onClick={uiFunctions.onMeetingClick}
                  formatDateTime={(t) => uiFunctions.formatDateTime(t, currentLocale)}
                />
              ))}
            </ul>
          )}
          {showLoadMoreSpinner ? (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-interactive-b01 border-t-transparent" />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}
