import Client from 'ringcentral-client';
import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';
import background from 'ringcentral-integration/lib/background';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import { selector } from 'ringcentral-integration/lib/selector';
import meetingStatus from 'ringcentral-integration/modules/Meeting/meetingStatus';
import { MeetingErrors } from 'ringcentral-integration/modules/Meeting';
import { getInitializedStartTime } from 'ringcentral-integration/helpers/meetingHelper';

import {
  RcVMeetingModel,
  RcVPreferencesGET,
  RcVPreferencesPATCH,
  RcVPreferences,
  RcVDialInNumberGET,
} from 'ringcentral-integration/models/rcv.model';

import actionTypes, { RcVideoActionTypes } from './actionTypes';
import getRcVReducer, {
  getDefaultVideoSettingReducer,
  getPersonalMeetingReducer,
} from './getRcVReducer';

import {
  getDefaultVideoSettings,
  validatePasswordSettings,
  generateRandomPassword,
  getTopic,
  pruneMeetingObject,
  DEFAULT_JBH,
  RcVideoTypes,
  transformPreferences,
  reversePreferences,
  comparePreferences,
  RCV_PREFERENCES_API_KEYS,
} from './videoHelper';

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
    { dep: 'RcVideoOptions', optional: true },
    { dep: 'AvailabilityMonitor', optional: true },
  ],
})
export class RcVideo extends RcModule<Record<string, any>, RcVideoActionTypes> {
  // TODO: add state interface
  private _alert: any;
  private _client: Client;
  private _defaultVideoSettingKey: string;
  private _personalMeetingKey: string;
  private _extensionInfo: any;
  private _brand: any;
  private _storage: any;
  private _availabilityMonitor: any;
  private _showSaveAsDefault: boolean;
  private _isInstantMeeting: boolean;
  private _fetchPersonMeetingTimeout: any;
  private _enablePersonalMeeting: boolean;

  _reducer: any;

  constructor({
    alert,
    client,
    extensionInfo,
    brand,
    storage,
    reducers,
    availabilityMonitor,
    showSaveAsDefault = false,
    isInstantMeeting = false,
    enablePersonalMeeting = false,
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
    this._reducer = getRcVReducer(this.actionTypes, reducers);
    this._showSaveAsDefault = showSaveAsDefault;
    this._isInstantMeeting = isInstantMeeting;
    this._availabilityMonitor = availabilityMonitor;
    this._defaultVideoSettingKey = 'defaultVideoSetting';
    this._personalMeetingKey = 'personalMeeting';
    this._enablePersonalMeeting = enablePersonalMeeting;
    if (this._showSaveAsDefault) {
      this._storage.registerReducer({
        key: this._defaultVideoSettingKey,
        reducer: getDefaultVideoSettingReducer(this.actionTypes),
      });
    }
    if (this._enablePersonalMeeting) {
      this._storage.registerReducer({
        key: this._personalMeetingKey,
        reducer: getPersonalMeetingReducer(this.actionTypes),
      });
    }
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  async _onStateChange() {
    if (this._shouldInit()) {
      await this._init();
    } else if (this._shouldReset()) {
      this._reset();
    }
  }

  _shouldInit() {
    return (
      this.pending &&
      this._extensionInfo.ready &&
      this._storage.ready &&
      (!this._availabilityMonitor || this._availabilityMonitor.ready)
    );
  }

  _shouldReset() {
    return (
      this.ready &&
      !this._extensionInfo.ready &&
      !this._storage.ready &&
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

    await this._initMeeting();

    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
  }

  /**
   * Init basic meeting information
   * also load meeting setting from previous one.
   */
  @background
  async init() {
    console.log('init meeting');
    await this._initMeeting();
  }

  @proxify
  async reload() {
    await this._initMeeting();
  }

  private async _initMeeting() {
    const preferences = await this._getPreferences();
    // TODO Remove the next line after rcv implement ui to manage password_instant
    preferences.password_instant = false;
    this.store.dispatch({
      type: this.actionTypes.updateMeetingPreferences,
      preferences,
    });
    this.updateMeetingSettings({
      ...this.defaultVideoSetting,
      meetingPassword: generateRandomPassword(10),
      isMeetingPasswordValid: true, // generated random password is valid
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
      const meeting = await this.fetchPersonalMeeting();
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
      notShowAgain,
    } = meeting;
    const updateInfo: {
      allowJoinBeforeHostV2: boolean;
      muteAudio: boolean;
      muteVideo: boolean;
      isMeetingSecret: boolean;
      _saved?: boolean;
    } = {
      allowJoinBeforeHostV2: allowJoinBeforeHost,
      muteAudio,
      muteVideo,
      isMeetingSecret,
    };
    if (notShowAgain) {
      updateInfo._saved = notShowAgain;
    }
    this.store.dispatch({
      type: this.actionTypes.saveAsDefaultSetting,
      meeting: updateInfo,
    });
  }

  validatePasswordSettings(password: string, isSecret: boolean): boolean {
    return validatePasswordSettings(password, isSecret);
  }

  generateRandomPassword() {
    return generateRandomPassword(10);
  }

  @proxify
  async createMeeting(
    meeting: RcVMeetingModel,
    { isAlertSuccess = true } = {},
  ) {
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

      this.updateMeetingSettings({
        ...meeting,
        saveAsDefault: false,
      });

      // After Create
      const dialInNumber = await this._getDialinNumbers();
      // sync preferences changes to rcv backend
      if (meeting.saveAsDefault) {
        await this.savePreferencesChanges(meeting as RcVPreferences);
      }
      // this will also fetch preference from rcv backend
      await this._initMeeting();

      if (isAlertSuccess) {
        setTimeout(() => {
          this._alert.info({
            message: meetingStatus.scheduledSuccess,
          });
        }, 50);
      }

      const meetingResponse = {
        extensionInfo: this._extensionInfo.info,
        dialInNumber,
        meeting: { ...meeting, ...meetingResult.json() },
      };

      return {
        ...meetingResponse,
        ...meeting,
      };
    } catch (errors) {
      this.store.dispatch({
        type: this.actionTypes.resetCreating,
      });
      this._errorHandle(errors);
      return null;
    } finally {
      delete (this.createMeeting as any)._promise;
    }
  }

  async instantMeeting(meeting: RcVMeetingModel): Promise<any> {
    return this.createMeeting({
      ...meeting,
      expiresIn: 86400,
      type: RcVideoTypes.call,
    });
  }

  private async _getDialinNumbers(): Promise<string> {
    const result = await this._client.service
      .platform()
      .get('/rcvideo/v1/dial-in-numbers');
    const { phoneNumbers } = result.json() as RcVDialInNumberGET;
    if (Array.isArray(phoneNumbers)) {
      const defaultPhoneNumber = phoneNumbers.find((obj) => obj.default);
      if (defaultPhoneNumber) {
        return defaultPhoneNumber.phoneNumber;
      }
    }
    return null;
  }

  private async _getPreferences(): Promise<RcVPreferencesGET> {
    const result = await this._client.service
      .platform()
      .get('/rcvideo/v1/account/~/extension/~/preferences', {
        id: RCV_PREFERENCES_API_KEYS,
      });
    return result.json().reduce((acc, { id, value }) => {
      return { ...acc, [id]: value };
    }, {});
  }

  updatePreference(preferences: RcVPreferencesPATCH) {
    this.store.dispatch({
      type: this.actionTypes.updateMeetingPreferences,
      preferences,
    });
  }

  private async _saveSinglePreference(
    preferenceId: keyof RcVPreferencesGET,
    value: boolean,
  ): Promise<void> {
    return this._client.service.platform().send({
      method: 'PATCH',
      url: `/rcvideo/v1/account/~/extension/~/preferences/${preferenceId}`,
      body: { value },
    });
  }

  /**
   * Determined the different between client and server, then save them to the server.
   * @param preferences preference fileds in meeting object
   * @param isOverwrite if true, dispatch updateMeetingPreferences on success
   */
  async savePreferencesChanges(
    preferences: RcVPreferences,
    isOverwrite = false,
  ): Promise<void> {
    const preferencesPayload = reversePreferences(
      preferences,
      this._isInstantMeeting,
    );
    type PreferenceEntries = [keyof RcVPreferencesGET, boolean];
    const dirtyPreferences = Object.entries(preferencesPayload).filter(
      (kvPairs): kvPairs is PreferenceEntries => {
        const [preferenceId, newValue] = kvPairs as PreferenceEntries;
        const oldValue = this.preferences[preferenceId];
        return newValue !== oldValue;
      },
    );
    try {
      await Promise.all(
        dirtyPreferences.map(([preferenceId, newValue]: PreferenceEntries) => {
          return this._saveSinglePreference(preferenceId, newValue);
        }),
      );
      if (isOverwrite) {
        this.updatePreference(preferencesPayload);
      }
    } catch (e) {
      console.error(e);
    }
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
        url: `/rcvideo/v1/bridges/${meeting.id}`,
        body: meeting,
      });

      // After Update
      const dialInNumber = await this._getDialinNumbers();
      if (meeting.saveAsDefault) {
        await this.savePreferencesChanges(meeting as RcVPreferences, true);
      }

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
        dialInNumber,
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
  updateMeetingSettings(meeting: RcVMeetingModel, patch: boolean = true) {
    this.store.dispatch({
      type: this.actionTypes.updateMeetingSettings,
      meeting,
      patch,
    });
    this._comparePreferences();
  }

  private _comparePreferences() {
    const { preferences, meeting } = this;
    this.store.dispatch({
      type: this.actionTypes.saveMeetingPreferencesState,
      isPreferencesChanged: comparePreferences(
        transformPreferences(preferences, this._isInstantMeeting),
        meeting,
      ),
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
        this._alert.danger({
          message: meetingStatus.internalError,
        });
      }
    }
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

  // preferences directly from backend
  get preferences(): RcVPreferencesGET {
    return this.state.preferences;
  }

  @selector
  defaultVideoSetting: any = [
    () => this.initialVideoSetting,
    () => {
      const savedSetting = this._showSaveAsDefault
        ? this.savedDefaultVideoSetting
        : {};
      return savedSetting;
    },
    () => this._isInstantMeeting,
    () => this.preferences,
    (initialSetting, savedSetting, isInstantMeeting, preferences) => {
      return {
        ...initialSetting,
        ...savedSetting,
        ...transformPreferences(preferences, isInstantMeeting),
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

  get savedDefaultVideoSetting() {
    const setting = this._storage.getItem(this._defaultVideoSettingKey);
    return migrateJBH(setting);
  }

  get isScheduling() {
    return this.state.creatingStatus === createStatus.creating;
  }

  get showSaveAsDefault() {
    return this._showSaveAsDefault;
  }

  get isPreferencesChanged() {
    return this.state.isPreferencesChanged;
  }

  get personalMeeting() {
    return this._storage.getItem(this._personalMeetingKey);
  }
}
