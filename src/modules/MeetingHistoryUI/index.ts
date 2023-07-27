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
  type = 'all';

  @state
  searchText = '';

  getUIProps() {
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
      type: this.type,
    };
  }

  getUIFunctions() {
    return {
      fetchMeetings: () => {
        return this.fetchHistoryMeeting();
      },
      dateTimeFormatter: (startTime) => {
        return this._deps.dateTimeFormat.formatDateTime({
          utcTimestamp: new Date(startTime).getTime(),
          type: 'long',
        });
      },
      fetchNextPageMeetings: () => {
        const pageToken = this.pageToken;
        return this.fetchHistoryMeeting(pageToken)
      },
      onClick: (meetingId) => {
        const host = `https://v.ringcentral.com`;
        window.open(`${host}/welcome/meetings/recordings/recording/${meetingId}`);
      },
      updateType: (type) => {
        this._updateType(type);
        this.fetchHistoryMeeting();
      },
      updateSearchText: (text) => {
        this._updateSearchText(text);
        this.onSearch();
      },
    };
  }

  @action
  private _updateType(type) {
    this.type = type;
    this.pageToken = null;
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

  async fetchHistoryMeeting(pageToken?: string) {
    if (this.fetching) {
      return;
    }
    if (pageToken === 'noNext') {
      return;
    }
    this._onFetchMeetings(pageToken);
    try {
      const result = await this._deps.genericMeeting.fetchHistoryMeetings({
        pageToken,
        searchText: this.searchText,
        type: this.type,
      });
      this._onFetchMeetingsSuccess(result.paging.nextPageToken || 'noNext');
    } catch (e) {
      console.error(e);
      this._onFetchMeetingsError();
    }
  }
}
