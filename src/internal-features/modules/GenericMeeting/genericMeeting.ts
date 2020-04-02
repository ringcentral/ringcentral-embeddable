import EventEmitter from 'events';
import { contains } from 'ramda';
import RcModule from 'ringcentral-integration/lib/RcModule';
import { Module } from 'ringcentral-integration/lib/di';
import Meeting from 'ringcentral-integration/modules/Meeting';
import Brand from 'ringcentral-integration/modules/Brand';
import ExtensionInfo from 'ringcentral-integration/modules/ExtensionInfo';
import proxify from 'ringcentral-integration/lib/proxy/proxify';
import background from 'ringcentral-integration/lib/background';

import {
  IGenericMeeting,
  MeetingEvents,
  ScheduleModel,
  ScheduledCallback,
} from './interface';

import { meetingProviderTypes } from '../MeetingProvider/interface';
import MeetingProvider from '../MeetingProvider';

import actionTypes from './actionTypes';

import RcVideo from '../RcV';

import getGenericMeetingReducer from './getGenericMeetingReducer';

@Module({
  deps: ['MeetingProvider', 'ExtensionInfo', 'Brand', 'Meeting', 'RcVideo'],
})
export class GenericMeeting extends RcModule implements IGenericMeeting {
  private _meetingProvider: MeetingProvider;
  private _meeting: Meeting;
  private _rcVideo: RcVideo;
  private _brand: Brand;
  private _extensionInfo: ExtensionInfo;
  private _eventEmitter = new EventEmitter();

  constructor({
    meeting,
    meetingProvider,
    rcVideo,
    brand,
    reducers,
    extensionInfo,
    ...options
  }) {
    super({
      ...options,
      actionTypes: options.actionTypes || actionTypes,
    });
    this._reducer = getGenericMeetingReducer(this.actionTypes, reducers);
    this._meeting = meeting;
    this._meetingProvider = meetingProvider;
    this._rcVideo = rcVideo;
    this._brand = brand;
    this._extensionInfo = extensionInfo;
  }

  initialize() {
    this.store.subscribe(() => this._onStateChange());
  }

  @background
  init() {
    return this._meetingModule && this._meetingModule.init();
  }

  @proxify
  reload() {
    return this._meetingModule && this._meetingModule.reload();
  }

  @proxify
  updateMeetingSettings(meeting) {
    const fn =
      this._meetingModule &&
      (this._meetingModule.update || this._meetingModule.updateMeetingSettings);
    return fn && (fn as Function).call(this._meetingModule, meeting);
  }

  @proxify
  async schedule(
    ...args: [ScheduleModel, { isAlertSuccess: boolean }, Window]
  ) {
    const fn =
      this._meetingModule &&
      (this._meetingModule.schedule || this._meetingModule.createMeeting);
    if (!fn) {
      return;
    }
    const res = await (fn as Function).apply(this._meetingModule, args);
    if (res) {
      this._eventEmitter.emit(MeetingEvents.afterSchedule, res, args[2]);
    } else if (args[2] && args[2].close) {
      args[2].close();
    }
    return res;
  }

  @proxify
  async getMeeting(meetingId: string) {
    return this._meetingModule && this._meetingModule.getMeeting(meetingId);
  }

  @proxify
  async updateMeeting(...args) {
    const fn = this._meetingModule && this._meetingModule.updateMeeting;
    return fn && (fn as Function).apply(this._meetingModule, args);
  }

  addScheduledCallBack(cb: ScheduledCallback) {
    this._eventEmitter.on(MeetingEvents.afterSchedule, cb);
  }

  removeScheduledCallBack(cb: ScheduledCallback) {
    this._eventEmitter.removeListener(MeetingEvents.afterSchedule, cb);
  }

  @proxify
  async fetchHistoryMeetings(params) {
    return (
      this._meetingModule && this._meetingModule.fetchHistoryMeetings(params)
    );
  }

  @proxify
  async cleanHistoryMeetings() {
    return this._meetingModule && this._meetingModule.cleanHistoryMeetings();
  }

  @proxify
  async fetchUpcomingMeetings() {
    return this._meetingModule && this._meetingModule.fetchUpcomingMeetings();
  }

  async addThirdPartyProvider(args) {
    return this._meetingModule && this._meetingModule.addThirdPartyProvider(args);
  }

  _onStateChange() {
    if (this._shouldInit()) {
      this._init();
    } else if (this._shouldReset()) {
      this._reset();
    }
  }

  private _shouldInit() {
    return (
      this.pending &&
      this._brand.ready &&
      this._extensionInfo.ready &&
      this._meetingProvider.ready &&
      this.meetingProviderType &&
      (this._meetingModule && this._meetingModule.ready)
    );
  }

  private _shouldReset() {
    return (
      this.ready &&
      ((this._meetingModule && !this._meetingModule.ready) ||
        !this._meetingProvider.ready ||
        !this._brand.ready ||
        !this._extensionInfo.ready ||
        !this.meetingProviderType)
    );
  }

  private _init() {
    this.store.dispatch({
      type: this.actionTypes.initSuccess,
    });
  }

  private _reset() {
    this.store.dispatch({
      type: this.actionTypes.resetSuccess,
    });
  }

  get meetingProviderType() {
    return this._meetingProvider.provider || null;
  }

  get isRCV() {
    return this.meetingProviderType === meetingProviderTypes.video;
  }

  get isRCM() {
    return contains(this.meetingProviderType, [
      meetingProviderTypes.meeting,
      meetingProviderTypes.none,
    ]);
  }

  get extensionInfo() {
    return this._extensionInfo.info;
  }

  private get _meetingModule() {
    if (this.isRCM) {
      return this._meeting;
    }
    if (this.isRCV) {
      return this._rcVideo;
    }
    return undefined;
  }

  get meeting() {
    return this._meetingModule && this._meetingModule.meeting;
  }

  get defaultMeetingSetting() {
    return (
      this._meetingModule &&
      (this._meetingModule.defaultVideoSetting ||
        this._meetingModule.defaultMeetingSetting)
    );
  }

  get isScheduling() {
    return !!(this._meetingModule && this._meetingModule.isScheduling);
  }

  get showSaveAsDefault() {
    return !!(this._meetingModule && this._meetingModule.showSaveAsDefault);
  }

  get brandName() {
    return this._brand.name;
  }

  get status() {
    return this.state.status;
  }

  get historyMeetings() {
    return this._meetingModule && this._meetingModule.historyMeetings;
  }

  get personalMeeting() {
    return this._meetingModule && this._meetingModule.personalMeeting;
  }

  get upcomingMeetings() {
    return this._meetingModule && this._meetingModule.upcomingMeetings;
  }
}
