import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcVideo as RcVideoBase } from '@ringcentral-integration/commons/modules/RcVideo';

import { action, state, track } from '@ringcentral-integration/core';

@Module({
  name: 'NewRcVideo',
  deps: []
})
export class RcVideo extends RcVideoBase {
  private _fetchingUpcomingMeetings: boolean;
  private _thirdPartyProviders: any;

  constructor(deps) {
    super(deps);
    this._fetchingUpcomingMeetings = false;
    this._thirdPartyProviders = {};
  }

  @state
  historyMeetings = [];

  @state
  upcomingMeetings = [];

  @action
  private _saveMeetings({ meetings, pageToken }) {
    if (!pageToken) {
      this.historyMeetings = meetings;
      return;
    }
    this.historyMeetings = [].concat(this.historyMeetings, meetings);
  }

  @action
  private _clearMeetings() {
    this.historyMeetings = [];
  }

  @action
  private _saveUpcomingMeetings({ meetings }) {
    this.upcomingMeetings = meetings;
  }

  @track(() => ['Create instant meeting'])
  async createInstantMeeting() {
    const meeting = await this.createMeeting({ type: 0 });
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
    const response = await this._deps.client.service
      .platform()
      .get('/rcvideo/v1/history/meetings', params);
    const data = await response.json();
    this._saveMeetings({
      meetings: data.meetings,
      pageToken,
    });
    return data;
  }

  async cleanHistoryMeetings() {
    this._clearMeetings();
  }

  async fetchUpcomingMeetings() {
    if (this._fetchingUpcomingMeetings) {
      return;
    }
    this._fetchingUpcomingMeetings = true;
    try {
      const meetings = await this._fetchUpcomingMeetings();
      this._saveUpcomingMeetings({ meetings });
    } catch (e) {
      console.error(e);
    }
    this._fetchingUpcomingMeetings = false;
  }

  async _fetchUpcomingMeetings() {
    const platform = this._deps.client.service.platform();
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
}
