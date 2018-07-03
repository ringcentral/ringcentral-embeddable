import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';

import actionTypes from './actionTypes';
import getReducer from './getReducer';

import requestWithPostMessage from '../../lib/requestWithPostMessage';
import searchContactPhoneNumbers from '../../lib/searchContactPhoneNumbers';

@Module({
  deps: [
    'Contacts',
    'ContactSearch',
    'ContactMatcher',
    { dep: 'ThirdPartyContactsOptions', optional: true, spread: true },
  ],
})
export default class ThirdPartyService extends RcModule {
  constructor({
    contacts,
    contactSearch,
    contactMatcher,
    ...options,
  }) {
    super({
      actionTypes,
      ...options,
    });

    this._reducer = getReducer(this.actionTypes);

    this._initialized = false;

    this._contacts = contacts;
    this._contactSearch = contactSearch;
    this._contactMatcher = contactMatcher;
  }

  initialize() {
    this._initialized = true;
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'rc-adapter-register-third-party-service' && this.serviceName === null) {
        const service = e.data.service;
        if (!service || !service.name) {
          return;
        }
        this.store.dispatch({
          type: this.actionTypes.register,
          serviceName: service.name,
        });
        if (service.contactsPath) {
          this._contactsPath = service.contactsPath;
          this._contacts.addSource(this);
          this.fetchContacts();
        }
        if (service.contactSearchPath) {
          this._registerContactSearch(service);
        }
        if (service.contactMatchPath) {
          this._registerContactMatch(service);
        }
        if (service.activitiesPath) {
          this._registerActivities(service);
        }
        if (service.conferenceInviteTitle && service.conferenceInvitePath) {
          this._registerConferenceInvite(service);
        }
        if (service.callLoggerPath) {
          this._registerCallLogger(service);
        }
      }
    });
  }

  _registerContactSearch(service) {
    this._contactSearchPath = service.contactSearchPath;
    this._contactSearch.addSearchSource({
      sourceName: this.sourceName,
      searchFn: async ({ searchString }) => {
        if (!searchString) {
          return [];
        }
        const contacts = await this.searchContacts(searchString);
        return searchContactPhoneNumbers(contacts, searchString, this.sourceName);
      },
      formatFn: entities => entities,
      readyCheckFn: () => this.sourceReady,
    });
    this._contactMatcher.triggerMatch();
  }

  _registerContactMatch(service) {
    this._contactMatchPath = service.contactMatchPath;
    this._contactMatcher.addSearchProvider({
      name: this.sourceName,
      searchFn: async ({ queries }) => {
        const result = await this.matchContacts(queries);
        return result;
      },
      readyCheckFn: () => this.sourceReady,
    });
  }

  _registerConferenceInvite(service) {
    this._conferenceInvitePath = service.conferenceInvitePath;
    this.store.dispatch({
      type: this.actionTypes.registerConferenceInvite,
      conferenceInviteTitle: service.conferenceInviteTitle,
    });
  }

  _registerActivities(service) {
    this._activitiesPath = service.activitiesPath;
    this._activityPath = service.activityPath;
    this.store.dispatch({
      type: this.actionTypes.registerActivities
    });
  }

  _registerCallLogger(service) {
    this._callLoggerPath = service.callLoggerPath;
    this.store.dispatch({
      type: this.actionTypes.registerCallLogger
    });
  }

  async _fetchContacts(page = 1) {
    const { data, nextPage } = await requestWithPostMessage(this._contactsPath, { page });
    if (!Array.isArray(data)) {
      return [];
    }
    if (!nextPage) {
      return data;
    }
    const nextPageData = await this._fetchContacts(nextPage);
    return data.concat(nextPageData);
  }

  async fetchContacts() {
    try {
      if (!this._contactsPath) {
        return;
      }
      const contacts = await this._fetchContacts();
      this.store.dispatch({
        type: this.actionTypes.fetchSuccess,
        contacts,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async searchContacts(searchString) {
    try {
      if (!this._contactSearchPath) {
        return [];
      }
      const { data } = await requestWithPostMessage(this._contactSearchPath, { searchString });
      if (!Array.isArray(data)) {
        return [];
      }
      return data;
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async matchContacts(phoneNumbers) {
    try {
      const result = {};
      if (!this._contactMatchPath) {
        return result;
      }
      const { data } = await requestWithPostMessage(this._contactMatchPath, { phoneNumbers });
      if (!data || Object.keys(data).length === 0) {
        return result;
      }
      phoneNumbers.forEach((phoneNumber) => {
        if (data[phoneNumber] && Array.isArray(data[phoneNumber])) {
          result[phoneNumber] = data[phoneNumber];
        } else {
          result[phoneNumber] = [];
        }
      });
      return result;
    } catch (e) {
      console.error(e);
      return {};
    }
  }

  async fetchActivities(contact) {
    try {
      if (!this._activitiesPath) {
        return;
      }
      this.store.dispatch({
        type: this.actionTypes.loadActivities,
      });
      const response = await requestWithPostMessage(this._activitiesPath, { contact });
      const activities = response.data;
      this.store.dispatch({
        type: this.actionTypes.loadActivitiesSuccess,
        activities,
      });
    } catch (e) {
      console.error(e);
    }
  }

  async openActivity(activity) {
    try {
      if (!this._activityPath) {
        return;
      }
      await requestWithPostMessage(this._activityPath, { activity });
    } catch (e) {
      console.error(e);
    }
  }

  async inviteConference(conference) {
    try {
      if (!this._conferenceInvitePath) {
        return;
      }
      await requestWithPostMessage(this._conferenceInvitePath, { conference });
    } catch (e) {
      console.error(e);
    }
  }

  async logCall(data) {
    try {
      if (!this._callLoggerPath) {
        return;
      }
      await requestWithPostMessage(this._callLoggerPath, data);
    } catch (e) {
      console.error(e);
    }
  }

  get contacts() {
    return this.state.contacts;
  }

  get serviceName() {
    return this.state.serviceName;
  }

  get sourceName() {
    return this.serviceName;
  }

  get status() {
    return this.state.status;
  }

  get sourceReady() {
    return this.state.sourceReady;
  }

  get activitiesRegistered() {
    return this.state.activitiesRegistered;
  }

  get activitiesLoaded() {
    return this.state.activitiesLoaded;
  }

  get activities() {
    return this.state.activities;
  }

  get conferenceInviteTitle() {
    return this.state.conferenceInviteTitle;
  }

  get callLoggerRegistered() {
    return this.state.callLoggerRegistered;
  }
}
