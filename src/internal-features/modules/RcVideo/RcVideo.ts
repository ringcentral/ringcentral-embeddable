import Client from 'ringcentral-client';
import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';
import background from 'ringcentral-integration/lib/background';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import { selector } from 'ringcentral-integration/lib/selector';
import meetingStatus from 'ringcentral-integration/modules/Meeting/meetingStatus';
import { MeetingErrors } from 'ringcentral-integration/modules/Meeting';
import { getInitializedStartTime } from 'ringcentral-integration/helpers/meetingHelper';

import actionTypes, { RcVideoActionTypes } from './actionTypes';
import getRcVReducer, {
  getDefaultVideoSettingReducer,
  getLastVideoStorageReducer,
  getPersonalMeetingReducer,
} from './getRcVReducer';

import {
  getDefaultVideoSettings,
  validatePasswordSettings,
  generateRandomPassword,
  getTopic,
  pruneMeetingObject,
  DEFAULT_JBH,
} from './videoHelper';
import { RcVMeetingModel } from '../../models/rcv.model';

import createStatus from './createStatus';

function migrateJBH(setting) {
  if (setting && Object.keys(setting).length) {
    setting.allowJoinBeforeHost =
      typeof setting.allowJoinBeforeHostV2 === 'boolean'
        ? setting.allowJoinBeforeHostV2
        : DEFAULT_JBH;
    delete setting.allowJoinBeforeHostV2;
  }
  return setting;
}

@Module({
  deps: [
    'Alert',
    'Client',
    'ExtensionInfo',
    'Brand',
    'Storage',
    'MeetingProvider',
    { dep: 'Conference', optional: true },
    { dep: 'RcVideoOptions', optional: true },
    { dep: 'AvailabilityMonitor', optional: true },
  ],
})
export class RcVideo extends RcModule<RcVideoActionTypes> {
  private _alert: any;
  private _client: Client;
  private _meetingProvider: any;
  private _defaultVideoSettingKey: string;
  private _lastVideoSettingKey: string;
  private _personalMeetingKey: string;
  private _extensionInfo: any;
  private _conference: any;
  private _brand: any;
  private _storage: any;
  private _availabilityMonitor: any;
  private _showSaveAsDefault: boolean;
  private _fetchPersonMeetingTimeout: any;
  private _enablePersonalMeeting: boolean;
  private _fetchingUpcomingMeetings: boolean;
  private _thirdPartyProviders: boolean;

  _reducer: any;

  constructor({
    alert,
    client,
    showSaveAsDefault,
    extensionInfo,
    brand,
    storage,
    reducers,
    conference,
    availabilityMonitor,
    enablePersonalMeeting = false,
    meetingProvider,
    ...options
  }) {
    super({
      ...options,
      actionTypes: options.actionTypes || actionTypes,
    });
    this._alert = alert;
    this._client = client;
    this._extensionInfo = extensionInfo;
    this._brand = brand;
    this._storage = storage;
    this._conference = conference;
    this._reducer = getRcVReducer(this.actionTypes, reducers);
    this._showSaveAsDefault = showSaveAsDefault;
    this._availabilityMonitor = availabilityMonitor;
    this._meetingProvider = meetingProvider;
    this._defaultVideoSettingKey = 'defaultVideoSetting';
    this._lastVideoSettingKey = 'lastVideoSetting';
    this._personalMeetingKey = 'personalMeeting';
    this._enablePersonalMeeting = enablePersonalMeeting;
    if (this._showSaveAsDefault) {
      this._storage.registerReducer({
        key: this._defaultVideoSettingKey,
        reducer: getDefaultVideoSettingReducer(this.actionTypes),
      });
    } else {
      this._storage.registerReducer({
        key: this._lastVideoSettingKey,
        reducer: getLastVideoStorageReducer(this.actionTypes),
      });
    }
    if (this._enablePersonalMeeting) {
      this._storage.registerReducer({
        key: this._personalMeetingKey,
        reducer: getPersonalMeetingReducer(this.actionTypes),
      });
    }
    this._fetchingUpcomingMeetings = false;
    this._thirdPartyProviders = {};
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this._init();
    } else if (this._shouldReset()) {
      this._reset();
    }
  }

  _shouldInit() {
    return (
      this.pending &&
      this._extensionInfo.ready &&
      this._storage.ready &&
      (this._meetingProvider.ready && this._meetingProvider.isRCV) &&
      (!this._availabilityMonitor || this._availabilityMonitor.ready)
    );
  }

  _shouldReset() {
    return (
      this.ready &&
      !this._extensionInfo.ready &&
      !this._storage.ready &&
      (!this._meetingProvider.ready || !this._meetingProvider.isRCV) &&
      (this._availabilityMonitor || !this._availabilityMonitor.ready)
    );
  }

  _reset() {
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  @proxify
  async _init() {
    this.store.dispatch({
      type: this.actionTypes.init,
    });

    if (this._enablePersonalMeeting) {
      await this._initPersonalMeeting();
    }

    this._initMeeting();

    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
  }

  /**
   * Init basic meeting information
   * also load meeting setting from previous one.
   */
  @background
  init() {
    console.log('init meeting');
    this._initMeeting();
  }

  @proxify
  reload() {
    this._initMeeting();
  }

  private _initMeeting() {
    this.updateMeetingSettings({
      ...this.currentVideoSetting,
      meetingPassword: generateRandomPassword(10),
      // generated random password is valid
      isMeetingPasswordValid: true,
    });
  }

  async _initPersonalMeeting() {
    if (this.personalMeeting.shortId) {
      return;
    }
    if (this._fetchPersonMeetingTimeout) {
      clearTimeout(this._fetchPersonMeetingTimeout);
    }
    try {
      const meeting = await this.fetchPersonalMeeting()
      this.store.dispatch({
        type: this.actionTypes.savePersonalMeeting,
        meeting,
      });
    } catch (e) {
      console.error('fetch default meeting error:', e);
      console.warn('retry after 10s');
      this._fetchPersonMeetingTimeout = setTimeout(() => {
       this._initPersonalMeeting();
      }, 10000);
    }
  }

  saveAsDefaultSetting(meeting) {
    const {
      allowJoinBeforeHost,
      muteAudio,
      muteVideo,
      isMeetingSecret,
      usePersonalMeetingId,
      notShowAgain
    } = meeting;
    const updateInfo: {
      allowJoinBeforeHost: boolean;
      muteAudio: boolean;
      muteVideo: boolean;
      _saved?: boolean;
      isMeetingSecret: boolean,
      usePersonalMeetingId: boolean,
    } = {
      allowJoinBeforeHost,
      muteAudio,
      muteVideo,
      isMeetingSecret,
      usePersonalMeetingId
    };

    if (notShowAgain) {
      updateInfo._saved = notShowAgain;
    }
    this.store.dispatch({
      type: this.actionTypes.saveAsDefaultSetting,
      meeting: updateInfo,
    });
  }

  saveLastVideoSetting(meeting) {
    const {
      allowJoinBeforeHost,
      muteAudio,
      muteVideo,
      isMeetingSecret,
      usePersonalMeetingId,
    } = meeting;
    const setting: {
      allowJoinBeforeHostV2: boolean;
      muteAudio: boolean;
      muteVideo: boolean;
      isMeetingSecret: boolean;
      usePersonalMeetingId: boolean;
    } = {
      allowJoinBeforeHostV2: allowJoinBeforeHost,
      muteAudio,
      muteVideo,
      isMeetingSecret,
      usePersonalMeetingId,
    };
    this.store.dispatch({
      type: this.actionTypes.saveLastVideoSetting,
      meeting: setting,
    });
  }

  validatePasswordSettings(password: string, isSecret: boolean): boolean {
    return validatePasswordSettings(password, isSecret);
  }

  generateRandomPassword() {
    return generateRandomPassword();
  }

  @proxify
  async createMeeting(meeting, { isAlertSuccess = true } = {}) {
    if (this.isScheduling) return (this.createMeeting as any)._promise;
    try {
      this.store.dispatch({
        type: this.actionTypes.initCreating,
      });

      if (this._showSaveAsDefault && meeting.saveAsDefault) {
        this.saveAsDefaultSetting(meeting);
      }

      (this
        .createMeeting as any)._promise = this._client.service
        .platform()
        .post('/rcvideo/v1/bridges', pruneMeetingObject(meeting));
      const meetingResult = await (this.createMeeting as any)._promise;

      this.store.dispatch({
        type: this.actionTypes.created,
        meeting,
      });

      this.saveLastVideoSetting(meeting);
      this.updateMeetingSettings({ ...meeting, saveAsDefault: false });
      this._initMeeting();

      if (isAlertSuccess) {
        setTimeout(() => {
          this._alert.info({
            message: meetingStatus.scheduledSuccess,
          });
        }, 50);
      }

      const meetingResponse = {
        extensionInfo: this._extensionInfo.info,
        dialInNumber: this._conference && this._conference.dialInNumber,
        meeting: { ...meeting, ...meetingResult.json() },
      };

      return {
        ...meetingResponse,
        ...meeting,
      };
    } catch (errors) {
      console.error(errors);
      this.store.dispatch({
        type: this.actionTypes.resetCreating,
      });
      this._errorHandle(errors);
      return null;
    } finally {
      delete (this.createMeeting as any)._promise;
    }
  }

  @proxify
  async createInstantMeeting() {
    const meeting = await this.createMeeting({ type: 0 })
    return meeting;
  }

  @proxify
  async getMeeting(meetingId: String) {
    const meetingResult = await this._client.service
      .platform()
      .get('/rcvideo/v1/bridges', { shortId: meetingId });
    return meetingResult.json();
  }

  @proxify
  async fetchPersonalMeeting() {
    const meetingResult = await this._client.service
      .platform()
      .get('/rcvideo/v1/bridges', { default: true });
    return meetingResult.json();
  }

  @proxify
  async updateMeeting(meetingId, meeting, { isAlertSuccess = false } = {}) {
    try {
      if (this._showSaveAsDefault && meeting.saveAsDefault) {
        this.saveAsDefaultSetting(meeting);
      }
      const meetingResult = await this._client.service.platform().send({
        method: 'PATCH',
        url: `/rcvideo/v1/bridges/${meeting.id || meetingId}`,
        body: meeting,
      });

      if (isAlertSuccess) {
        setTimeout(() => {
          this._alert.info({
            message: meetingStatus.updatedSuccess,
          });
        }, 50);
      }
      const newMeeting = meetingResult.json();
      const meetingResponse = {
        extensionInfo: this._extensionInfo.info,
        dialInNumber: this._conference && this._conference.dialInNumber,
        meeting: { ...meeting, ...newMeeting },
      };
      if (this.personalMeeting && newMeeting.id === this.personalMeeting.id) {
        this.store.dispatch({
          type: this.actionTypes.savePersonalMeeting,
          meeting: newMeeting,
        });
      }
      return meetingResponse;
    } catch (errors) {
      this._errorHandle(errors);
      return null;
    }
  }

  @proxify
  updateMeetingSettings(meeting: RcVMeetingModel) {
    this.store.dispatch({
      type: this.actionTypes.updateMeetingSettings,
      meeting,
    });
  }

  private _errorHandle(errors: any) {
    if (errors instanceof MeetingErrors) {
      for (const error of errors.all) {
        this._alert.warning(error);
      }
    } else if (errors && errors.apiResponse) {
      const { errorCode, permissionName } = errors.apiResponse.json();
      if (errorCode === 'InsufficientPermissions' && permissionName) {
        this._alert.danger({
          message: meetingStatus.insufficientPermissions,
          payload: {
            permissionName,
          },
        });
      } else if (
        !this._availabilityMonitor ||
        !this._availabilityMonitor.checkIfHAError(errors)
      ) {
        this._alert.danger({ message: meetingStatus.internalError });
      }
    }
    return null;
  }

  @proxify
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
    const data = response.json();
    this.store.dispatch({
      type: this.actionTypes.saveMeetings,
      meetings: data.meetings,
      pageToken,
    });
    return data;
  }

  @proxify
  async cleanHistoryMeetings() {
    this.store.dispatch({
      type: this.actionTypes.cleanMeetings,
    });
  }

  @proxify
  async fetchUpcomingMeetings() {
    if (this._fetchingUpcomingMeetings) {
      return;
    }
    this._fetchingUpcomingMeetings = true;
    try {
      const meetings = await this._fetchUpcomingMeetings();
      this.store.dispatch({
        type: this.actionTypes.saveUpcomingMeetings,
        meetings,
      });
    } catch (e) {
      console.error(e);
    }
    this._fetchingUpcomingMeetings = false;
  }

  @proxify
  async _fetchUpcomingMeetings() {
    const platform = this._client.service.platform();
    const providersRes = await platform.get('/rcvideo/v1/scheduling/providers')
    const providers = providersRes.json().providers.filter(p => p.isAuthorized);
    let allEvents = [];
    await Promise.all(providers.map(async (provider) => {
      const calendersRes = await platform.get(`/rcvideo/v1/scheduling/providers/${provider.id}/calendars`)
      const calendars = calendersRes.json().calendars.filter(
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
        const events = eventsRes.json().events;
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

  get meeting() {
    return this.state.meeting;
  }

  get extensionName() {
    return this._extensionInfo.info && this._extensionInfo.info.name;
  }

  get brandName() {
    return this._brand.name;
  }

  get status() {
    return this.state.status;
  }


  @selector
  currentVideoSetting: any = [
    () => this.initialVideoSetting,
    () => {
      const savedSetting = this._showSaveAsDefault
        ? this.defaultVideoSetting
        : this.lastVideoSetting;
      return savedSetting;
    },
    (initialSetting, savedSetting) => {
      return {
        ...initialSetting,
        ...savedSetting,
      };
    },
  ];

  @selector
  initialVideoSetting: any = [
    () => this.extensionName,
    () => this.brandName,
    () => getInitializedStartTime(),
    (extensionName, brandName, startTime) => {
      const topic = getTopic(extensionName, brandName);
      const setting = getDefaultVideoSettings({
        topic,
        startTime: new Date(startTime),
      });
      return setting;
    },
  ];

  get defaultVideoSetting() {
    const setting = this._storage.getItem(this._defaultVideoSettingKey);
    return migrateJBH(setting);
  }

  get lastVideoSetting() {
    const setting = this._storage.getItem(this._lastVideoSettingKey);
    return migrateJBH(setting);
  }

  get isScheduling() {
    return this.state.creatingStatus === createStatus.creating;
  }

  get showSaveAsDefault() {
    return !!this._showSaveAsDefault;
  }

  get personalMeeting() {
    return this._storage.getItem(this._personalMeetingKey) || {};
  }

  get upcomingMeetings() {
    return this.state.upcomingMeetings;
  }
}
