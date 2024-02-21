import { Module } from '@ringcentral-integration/commons/lib/di';
import debounce from '@ringcentral-integration/commons/lib/debounce';
import {
  RcUIModuleV2,
  state,
  action,
} from '@ringcentral-integration/core';

@Module({
  name: 'MeetingHistoryUI',
  deps: ['GenericMeeting', 'Locale', 'DateTimeFormat'],
})
export class MeetingHistoryUI extends RcUIModuleV2 {
  private _type: string;

  constructor(deps) {
    super({
      deps,
    });
  }

  @state
  fetching = false;

  @state
  pageToken = null;

  @state
  searchText = '';

  getUIProps({
    type,
  }) {
    return {
      currentLocale: this._deps.locale.ready && this._deps.locale.currentLocale,
      showSpinner: !(
        this._deps.genericMeeting.ready &&
        this._deps.locale.ready &&
        this._deps.dateTimeFormat.ready
      ) || (this.fetching && !this.pageToken),
      fetchingNextPage: (this.fetching && this.pageToken),
      meetings: this._deps.genericMeeting.historyMeetings,
      searchText: this.searchText,
      type,
    };
  }

  getUIFunctions() {
    return {
      fetchMeetings: (type) => {
        return this.fetchHistoryMeeting(type);
      },
      dateTimeFormatter: (startTime) => {
        return this._deps.dateTimeFormat.formatDateTime({
          utcTimestamp: new Date(startTime).getTime(),
          type: 'long',
        });
      },
      fetchNextPageMeetings: (type) => {
        const pageToken = this.pageToken;
        return this.fetchHistoryMeeting(type, pageToken)
      },
      onClick: (meetingId) => {
        const host = `https://v.ringcentral.com`;
        window.open(`${host}/welcome/meetings/recordings/recording/${meetingId}`);
      },
      updateSearchText: (text, type) => {
        this._updateSearchText(text);
        this.onSearch(type);
      },
    };
  }

  @action
  private _updateSearchText(text) {
    this.searchText = text;
    this.pageToken = null;
  }

  @action
  private _onFetchMeetings(pageToken) {
    this.fetching = true;
    this.pageToken = pageToken || null;
  }

  @action
  private _onFetchMeetingsSuccess(nextPageToken) {
    this.fetching = false;
    this.pageToken = nextPageToken;
  }

  @action
  private _onFetchMeetingsError() {
    this.fetching = false;
  }

  onSearch = debounce(this.fetchHistoryMeeting, 300, false)

  async fetchHistoryMeeting(type, pageToken?: string) {
    if (this.fetching && this._type === type) {
      return;
    }
    this._type = type;
    if (pageToken === 'noNext') {
      return;
    }
    this._onFetchMeetings(pageToken);
    try {
      const result = await this._deps.genericMeeting.fetchHistoryMeetings({
        pageToken,
        searchText: this.searchText,
        type,
      });
      this._onFetchMeetingsSuccess(result.paging.nextPageToken || 'noNext');
    } catch (e) {
      console.error(e);
      this._onFetchMeetingsError();
    }
  }
}
