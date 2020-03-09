import Client from 'ringcentral-client';
import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';
import background from 'ringcentral-integration/lib/background';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import meetingStatus from 'ringcentral-integration/modules/Meeting/meetingStatus';
import { MeetingErrors } from 'ringcentral-integration/modules/Meeting';
import { getInitializedStartTime } from 'ringcentral-integration/helpers/meetingHelper';

import actionTypes, { RcVideoActionTypes } from './actionTypes';
import getRcVReducer, {
  getDefaultVideoSettingReducer,
  getLastVideoStorageReducer,
} from './getRcVReducer';

import { getDefaultVideoSettings } from './videoHelper';
import { RcVMeetingModel } from '../../models/rcv.model';

import createStatus from './createStatus';

@Module({
  deps: [
    'Alert',
    'Client',
    'ExtensionInfo',
    'Brand',
    'Storage',
    { dep: 'Conference', optional: true },
    { dep: 'RcVideoOptions', optional: true },
    { dep: 'AvailabilityMonitor', optional: true },
  ],
})
export class RcVideo extends RcModule<RcVideoActionTypes> {
  private _alert: any;
  private _client: Client;
  private _defaultVideoSettingKey: string;
  private _lastVideoSettingKey: string;
  private _extensionInfo: any;
  private _conference: any;
  private _brand: any;
  private _storage: any;
  private _availabilityMonitor: any;
  private _showSaveAsDefault: boolean;
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
    this._defaultVideoSettingKey = 'defaultVideoSetting';
    this._lastVideoSettingKey = 'lastVideoSetting';
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
  _init() {
    const topic = `${this.extensionName}'s ${this.brandName} Meeting`;
    const startTime = getInitializedStartTime();
    const meeting = getDefaultVideoSettings({ topic, startTime });

    const storageSetting = this._showSaveAsDefault
      ? this.defaultVideoSetting
      : this.lastVideoSetting;

    this.store.dispatch({
      type: this.actionTypes.initSuccess,
      meeting: {
        ...meeting,
        ...storageSetting,
      },
    });

    if (this._showSaveAsDefault) {
      if (!Object.keys(this.defaultVideoSetting).length) {
        this._saveAsDefaultSetting(meeting);
      }
    }
  }

  /**
   * Init basic meeting information
   * also load meeting settings from previous one.
   */
  @background
  init() {
    console.log('init meeting');
    this._setMeetingFieldsAsDefaultValue();
  }

  @proxify
  reload() {
    this._setMeetingFieldsAsDefaultValue();
  }

  _setMeetingFieldsAsDefaultValue() {
    const topic = `${this.extensionName}'s ${this.brandName} Meeting`;
    const startTime = getInitializedStartTime();
    const defaultVideo = getDefaultVideoSettings({ topic, startTime });
    if (this._showSaveAsDefault) {
      this.store.dispatch({
        type: this.actionTypes.updateMeetingSettings,
        meeting: {
          ...defaultVideo,
          // Load saved default meeting settings
          ...this.defaultVideoSetting,
        },
      });
    } else {
      this.store.dispatch({
        type: this.actionTypes.updateMeetingSettings,
        meeting: {
          ...defaultVideo,
          ...this.lastVideoSetting,
        },
      });
    }
  }

  _saveAsDefaultSetting(meeting) {
    const { allowJoinBeforeHost, muteAudio, muteVideo, notShowAgain } = meeting;
    const updateInfo: {
      allowJoinBeforeHost: boolean;
      muteAudio: boolean;
      muteVideo: boolean;
      _saved?: boolean;
    } = { allowJoinBeforeHost, muteAudio, muteVideo };
    // sync info to cti.
    this.store.dispatch({
      type: this.actionTypes.updateMeetingSettings,
      meeting: updateInfo,
    });

    if (notShowAgain) {
      updateInfo._saved = notShowAgain;
    }
    this.store.dispatch({
      type: this.actionTypes.saveAsDefaultSetting,
      meeting: updateInfo,
    });
  }

  @proxify
  async createMeeting(meeting, { isAlertSuccess = true } = {}) {
    if (this.isScheduling) return (this.createMeeting as any)._promise;
    try {
      this.store.dispatch({
        type: this.actionTypes.initCreating,
      });

      if (this._showSaveAsDefault && meeting.saveAsDefault) {
        this._saveAsDefaultSetting(meeting);
      }

      (this
        .createMeeting as any)._promise = this._client.service
        .platform()
        .post('/rcvideo/v1/bridges', meeting);
      const meetingResult = await (this.createMeeting as any)._promise;

      this.store.dispatch({
        type: this.actionTypes.created,
        meeting,
      });

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
        meeting: Object.assign({}, meeting, meetingResult.json()),
      };

      this.updateMeetingSettings({ ...meeting, saveAsDefault: false });
      this._setMeetingFieldsAsDefaultValue();

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

  @proxify
  async getMeeting(meetingId: String) {
    const meetingResult = await this._client.service
      .platform()
      .get('/rcvideo/v1/bridges', { shortId: meetingId });
    return meetingResult.json();
  }

  @proxify
  async updateMeeting(meetingId, meeting, { isAlertSuccess = false } = {}) {
    try {
      if (this._showSaveAsDefault && meeting.saveAsDefault) {
        this._saveAsDefaultSetting(meeting);
      }
      const meetingResult = await this._client.service.platform().send({
        method: 'PATCH',
        url: `/rcvideo/v1/bridges/${meeting.id}`,
        body: meeting,
      });

      if (isAlertSuccess) {
        setTimeout(() => {
          this._alert.info({
            message: meetingStatus.updatedSuccess,
          });
        }, 50);
      }

      const meetingResponse = {
        extensionInfo: this._extensionInfo.info,
        dialInNumber: this._conference && this._conference.dialInNumber,
        meeting: Object.assign({}, meeting, meetingResult.json()),
      };
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

  get defaultVideoSetting() {
    const topic = `${this.extensionName}'s ${this.brandName} Meeting`;
    const startTime = getInitializedStartTime();
    return (
      this._storage.getItem(this._defaultVideoSettingKey) ||
      getDefaultVideoSettings({ topic, startTime })
    );
  }

  get lastVideoSetting() {
    return this._storage.getItem(this._lastVideoSettingKey) || {};
  }

  get isScheduling() {
    return this.state.creatingStatus === createStatus.creating;
  }

  get showSaveAsDefault() {
    return !!this._showSaveAsDefault;
  }
}
