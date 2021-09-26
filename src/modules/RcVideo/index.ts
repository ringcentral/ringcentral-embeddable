import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcVideo } from '@ringcentral-integration/commons/modules/RcVideo/RcVideo'; // TODO: replace with widgets lib

import {
  getHistoryMeetingsReducer,
  getUpcomingMeetingsReducer,
} from './getReducer';

import additionalActionTypes from './actionTypes';

@Module({
  name: 'NewRcVideo',
  deps: [
    'MeetingProvider',
  ]
})
export default class NewRcVideo extends RcVideo {
  private _fetchingUpcomingMeetings: boolean;
  private _thirdPartyProviders: any;

  constructor(options) {
    super({
      reducers: {
        historyMeetings: getHistoryMeetingsReducer(additionalActionTypes),
        upcomingMeetings: getUpcomingMeetingsReducer(additionalActionTypes),
      },
      enablePersonalMeeting: true,
      ...options,
    });
    this._fetchingUpcomingMeetings = false;
    this._thirdPartyProviders = {};
  }

  async createInstantMeeting() {
    const meeting = await this.createMeeting({ type: 0 })
    return meeting;
  }

  async fetchHistoryMeetings({
    pageToken, searchText, type
  } : {
    pageToken?: undefined,
    searchText?: undefined,
    type?: undefined,
  } = {}) {
    const params = { perPage: 20 } as any;
    if (pageToken) {
      params.pageToken = pageToken;
    }
    if (searchText) {
      params.text = searchText;
    }
    if (type === 'recordings') {
      params.type = 'All';
    }
    const response = await this._client.service
      .platform()
      .get('/rcvideo/v1/history/meetings', params);
    const data = await response.json();
    this.store.dispatch({
      type: additionalActionTypes.saveMeetings,
      meetings: data.meetings,
      pageToken,
    });
    return data;
  }

  async cleanHistoryMeetings() {
    this.store.dispatch({
      type: additionalActionTypes.cleanMeetings,
    });
  }

  async fetchUpcomingMeetings() {
    if (this._fetchingUpcomingMeetings) {
      return;
    }
    this._fetchingUpcomingMeetings = true;
    try {
      const meetings = await this._fetchUpcomingMeetings();
      this.store.dispatch({
        type: additionalActionTypes.saveUpcomingMeetings,
        meetings,
      });
    } catch (e) {
      console.error(e);
    }
    this._fetchingUpcomingMeetings = false;
  }

  async _fetchUpcomingMeetings() {
    const platform = this._client.service.platform();
    const providersRes = await platform.get('/rcvideo/v1/scheduling/providers');
    const providersData = await providersRes.json();
    const providers = providersData.providers.filter(p => p.isAuthorized);
    let allEvents = [];
    await Promise.all(providers.map(async (provider) => {
      const calendersRes = await platform.get(`/rcvideo/v1/scheduling/providers/${provider.id}/calendars`)
      const calendersData = await calendersRes.json();
      const calendars = calendersData.calendars.filter(
        c => c.isPrimary
      );
      const fromDate = new Date();
      const toDate = new Date();
      toDate.setDate(toDate.getDate() + 7)
      await Promise.all(calendars.map(async (calendar) => {
        const eventsRes = await platform.get(
          `/rcvideo/v1/scheduling/providers/${provider.id}/calendars/${encodeURIComponent(calendar.id)}/events`,
          {
            includeNonRcEvents: true,
            startTimeFrom: fromDate.toISOString(),
            startTimeTo: toDate.toISOString(),
          }
        )
        const eventsData = await eventsRes.json();
        const events = eventsData.events;
        allEvents = allEvents.concat(events);
      }));
    }));
    await Promise.all(Object.keys(this._thirdPartyProviders).map(async (name) => {
      const fetchFunc = this._thirdPartyProviders[name].fetchUpcomingMeetingList;
      const events = await fetchFunc();
      allEvents = allEvents.concat(events);
    }));
    return allEvents.sort((a, b) => {
      const date1 = (new Date(a.startTime)).getTime();
      const date2 = (new Date(b.startTime)).getTime();
      return date1 - date2;
    });
  }

  addThirdPartyProvider({ name, fetchUpcomingMeetingList }) {
    this._thirdPartyProviders[name] = {
      fetchUpcomingMeetingList: fetchUpcomingMeetingList,
    };
  }

  removeThirdPartyProvider({ name }) {
    delete this._thirdPartyProviders[name];
  }

  get historyMeetings() {
    return this.state.historyMeetings;
  }

  get upcomingMeetings() {
    return this.state.upcomingMeetings;
  }
}
