import { Module } from '@ringcentral-integration/commons/lib/di';
import debounce from '@ringcentral-integration/commons/lib/debounce';
import RcUIModule from '@ringcentral-integration/widgets/lib/RcUIModule';

import getReducer from './getReducer';
import actionTypes from './actionTypes';

@Module({
  name: 'MeetingHistoryUI',
  deps: ['GenericMeeting', 'Locale', 'DateTimeFormat'],
})
export default class MeetingHistoryUI extends RcUIModule {
  private _genericMeeting: any;
  private _locale: any;
  private _dateTimeFormat: any;
  
  _reducer: any;

  constructor({ genericMeeting, locale, dateTimeFormat, ...options }) {
    super({
      ...options,
      actionTypes: actionTypes,
    });
    this._reducer = getReducer(this.actionTypes);
    this._genericMeeting = genericMeeting;
    this._locale = locale;
    this._dateTimeFormat = dateTimeFormat;
  }

  getUIProps() {
    return {
      currentLocale: this._locale.ready && this._locale.currentLocale,
      showSpinner: !(
        this._genericMeeting.ready &&
        this._locale.ready &&
        this._dateTimeFormat.ready
      ) || (this.fetching && !this.pageToken),
      fetchingNextPage: (this.fetching && this.pageToken),
      meetings: this._genericMeeting.historyMeetings,
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
        return this._dateTimeFormat.formatDateTime({
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
        this.store.dispatch({
          type: this.actionTypes.updateType,
          meetingType: type,
        });
        this.fetchHistoryMeeting();
      },
      updateSearchText: (text) => {
        this.store.dispatch({
          type: this.actionTypes.updateSearchText,
          searchText: text,
        });
        this.onSearch();
      },
    };
  }

  onSearch = debounce(this.fetchHistoryMeeting, 300, false)

  async fetchHistoryMeeting(pageToken?: string) {
    if (this.fetching) {
      return;
    }
    if (pageToken === 'noNext') {
      return;
    }
    this.store.dispatch({
      type: this.actionTypes.fetchMeetings,
      pageToken,
    });
    try {
      const result = await this._genericMeeting.fetchHistoryMeetings({
        pageToken,
        searchText: this.searchText,
        type: this.type,
      });
      this.store.dispatch({
        type: this.actionTypes.fetchMeetingsSuccess,
        nextPageToken: result.paging.nextPageToken || 'noNext',
      });
    } catch (e) {
      console.error(e);
      this.store.dispatch({
        type: this.actionTypes.fetchMeetingsError,
      });
    }
  }

  get fetching() {
    return this.state.fetching;
  }

  get pageToken() {
    return this.state.pageToken;
  }

  get searchText() {
    return this.state.searchText;
  }

  get type() {
    return this.state.type;
  }
}
