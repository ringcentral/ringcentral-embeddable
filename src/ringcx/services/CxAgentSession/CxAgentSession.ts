import { Locale, Toast } from '@ringcentral-integration/micro-core/src/app/services';
import { BlockPlugin } from '@ringcentral-integration/micro-core/src/app/plugins';
import {
  action,
  computed,
  injectable,
  RcModule,
  state,
  storage,
  StoragePlugin,
  PortManager,
  delegate,
  RouterPlugin,
  watch,
} from '@ringcentral-integration/next-core';
import { sleep } from '@ringcentral-integration/commons/utils';
import { EventEmitter } from 'events';
import { equals } from 'ramda';
import { parseNumber } from '../../lib/parseNumber';
import type { LoginTypes } from '../../enums';
import {
  agentSessionEvents,
  dialoutStatuses,
  dropDownOptions,
  loginTypes,
  messageTypes,
} from '../../enums';
import type { CxAgentConfig } from '../CxClient/interfaces';
import { CxClient } from '../CxClient';
import { evStatus } from '../CxClient/enums';
import { CxAuth } from '../CxAuth';
import { CxPresence } from '../CxPresence';
import { CxMultiLoginView } from '../../views/CxMultiLoginView';
import type {
  FormGroup,
  LoginTypeItem,
  ConfigureAgentParams,
  DialGroup,
  CxConfigureAgentOptions,
} from './CxAgentSession.interface';
import i18n, { t } from './i18n';
import { track } from '../Analytics/track';
import { trackEvents } from '../../lib/trackEvents';
import { cxPath, isCxAgentPath } from '../../routes';

const WAIT_EV_SERVER_ROLLBACK_DELAY = 2000;

const ACCEPTABLE_LOGIN_TYPES = [
  loginTypes.integrated,
  loginTypes.RC_PHONE,
  loginTypes.external,
];

const DEFAULT_LOGIN_TYPE = loginTypes.integrated;
const NONE = dropDownOptions.None;

const DEFAULT_FORM_GROUP: FormGroup = {
  selectedInboundQueueIds: [],
  loginType: DEFAULT_LOGIN_TYPE,
  selectedSkillProfileId: NONE,
  extensionNumber: '',
  autoAnswer: false,
  dialGroupId: '',
};

/**
 * CxAgentSession module - Agent session configuration management
 * Handles login types, inbound queues, skill profiles, and session updates
 */
@injectable({
  name: 'CxAgentSession',
})
class CxAgentSession extends RcModule {
  public isForceLogin = false;
  public isReconnected = false;
  public isAgentUpdating = false;

  private _eventEmitter = new EventEmitter();
  private _isLogin = false;

  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private cxPresence: CxPresence,
    private toast: Toast,
    private locale: Locale,
    private block: BlockPlugin,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    private multiLoginView: CxMultiLoginView,
    private router: RouterPlugin,
  ) {
    super();
    this.storagePlugin.enable(this);
    // Login success event should be registered in constructor to capture event before onInitOnce
    
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this._initialize();
      });
      this.portManager.onClient(() => {
        this._initializeClient();
      });
    } else {
      this._initialize();
      this._initializeClient();
    }
  }

  /**
   * Show multi-login confirmation modal and return user's choice
   * @returns true if user confirms, false if user cancels
   */
  private async _showMultiLoginConfirm(): Promise<boolean> {
    return this.multiLoginView.showConfirm();
  }

  /**
   * Initialize agent session on login success
   */
  private async _initialize(): Promise<void> {
    this.cxAuth.onceLoginSuccess(() => {
      this.logger.info('----------onceLoginSuccess');
      this._isLogin = true;
    });
    // Logout event should be in constructor, when logout that will not call init
    this.cxAuth.beforeAgentLogout(() => {
      this._resetAllState();
    });
    this.onConfigSuccess(async () => {
      const hasCall = this.cxPresence.calls.length > 0;
      // Set dialout status to idle if no calls
      if (!hasCall) {
        await this.cxPresence.setDialoutStatus(dialoutStatuses.idle);
      }
      if (this.isAgentUpdating) {
        this.isAgentUpdating = false;
        return;
      }
      // A configuration can also succeed while a call is up, for a reconnect
      // for example, and the call pages own the route for as long as the call
      // lasts.
      if (hasCall) {
        this.logger.info('skip dialer navigation during a call');
        return;
      }
      this.logger.info('!!!!to Dialer');
      this._navigateWithinAgent(cxPath.home('dialer'));
    });
    if (this._isLogin) {
      await this.initAgentSession();
    }
    // Listen for subsequent login success events (reconnections, re-logins)
    this.cxAuth.onLoginSuccess(async () => {
      this.logger.info('onLoginSuccess event');
      await this.initAgentSession();
    });
  }

  private _initializeClient() {
    watch(
      this,
      () => this.configSuccess,
      () => {
        if (this.configSuccess) {
          this.cxAuth.identifyAnalyticsUser();
        }
      },
    );
  }

  /**
   * Computed property to check if login is successful and module is ready
   */
  @computed((that: CxAgentSession) => [
    that.cxAuth.isEvLogged,
    that.ready,
  ])
  get isOnLoginSuccess(): boolean {
    return this.ready && this.cxAuth.isEvLogged;
  }

  @storage
  @state
  selectedSkillProfileId: string = NONE;

  @storage
  @state
  selectedInboundQueueIds: string[] = [];

  @storage
  @state
  loginType: LoginTypes = DEFAULT_LOGIN_TYPE;

  @storage
  @state
  extensionNumber = '';

  @storage
  @state
  autoAnswer = false;

  @storage
  @state
  dialGroupId = '';

  @storage
  @state
  configured = false;

  @state
  configSuccess = false;

  @state
  configuring = false;

  @storage
  @state
  formGroup: FormGroup = DEFAULT_FORM_GROUP;

  get isExternalPhone(): boolean {
    return this.formGroup.loginType === loginTypes.external;
  }

  get isIntegratedSoftphone(): boolean {
    return this.loginType === loginTypes.integrated;
  }

  @computed((that: CxAgentSession) => [that.locale.currentLocale])
  get loginTypeList(): LoginTypeItem[] {
    const { currentLocale } = this.locale;
    return ACCEPTABLE_LOGIN_TYPES.map((type) => ({
      id: type,
      label: i18n.getString(type, currentLocale),
    }));
  }

  @computed((that: CxAgentSession) => [
    that.cxAuth.agentConfig,
    that.cxAuth.isFreshLogin,
  ])
  get inboundQueues() {
    const { agentConfig, agentPermissions } = this.cxAuth;
    if (
      !agentConfig ||
      !agentConfig?.inboundSettings ||
      !agentPermissions?.allowInbound
    ) {
      return [];
    }
    const {
      inboundSettings: { availableQueues = [] },
    } = agentConfig;
    const { isFreshLogin } = this.cxAuth;
    return availableQueues.map((queue) => ({
      gateId: queue.gateId,
      gateName: queue.gateName,
      checked: isFreshLogin,
    }));
  }

  @computed((that: CxAgentSession) => [that.cxAuth.agentConfig])
  get dialGroups(): DialGroup[] {
    const { agentConfig, agentPermissions } = this.cxAuth;
    const noneItem: DialGroup = {
      groupId: '',
      groupName: 'None',
      dialMode: '',
    };
    if (
      !agentConfig ||
      !agentConfig?.outboundSettings ||
      !agentPermissions?.allowOutbound
    ) {
      return [noneItem];
    }
    const {
      outboundSettings: { availableOutdialGroups = [] },
    } = agentConfig;
    return [noneItem].concat(
      availableOutdialGroups
        .filter((g: any) => g.dialMode === 'PREDICTIVE' || g.dialMode === 'PREVIEW')
        .map((group: any) => ({
          groupId: group.dialGroupId,
          groupName: group.dialGroupName,
          groupDesc: group.dialGroupDesc,
          dialMode: group.dialMode,
        })),
    );
  }

  @computed((that: CxAgentSession) => [that.dialGroupId, that.dialGroups])
  get currentDialMode(): string {
    if (!this.dialGroupId) {
      return '';
    }
    const group = this.dialGroups.find((g) => g.groupId === this.dialGroupId);
    return group?.dialMode || '';
  }

  @computed((that: CxAgentSession) => [that.cxAuth.agentConfig])
  get defaultDialGroupId(): string {
    const { agentConfig } = this.cxAuth;
    if (!agentConfig || !agentConfig.outboundSettings) {
      return '';
    }
    return agentConfig.outboundSettings.defaultDialGroup || '';
  }

  @computed((that: CxAgentSession) => [that.cxAuth.agent, that.locale.currentLocale])
  get skillProfileList() {
    const { agentConfig } = this.cxAuth.agent || {};
    if (!agentConfig || !agentConfig.inboundSettings) {
      return [];
    }
    const {
      inboundSettings: { availableSkillProfiles = [] },
    } = agentConfig;
    const defaultSkill = this._pickSkillProfile(availableSkillProfiles);
    if (!defaultSkill && availableSkillProfiles.length > 0) {
      return [
        {
          profileId: NONE,
          profileName: i18n.getString(NONE, this.locale.currentLocale),
        },
        ...availableSkillProfiles,
      ];
    }
    return availableSkillProfiles;
  }

  @computed((that: CxAgentSession) => [that.skillProfileList])
  get defaultSkillProfileId(): string {
    const defaultSkill = this._pickSkillProfile(this.skillProfileList);
    return defaultSkill ? defaultSkill.profileId : NONE;
  }

  @computed((that: CxAgentSession) => [
    that.skillProfileList,
    that.formGroup,
  ])
  get selectedSkillProfile(): string | undefined {
    const selectedSkillProfile = this.skillProfileList.find(
      (profile) => profile.profileId === this.formGroup.selectedSkillProfileId,
    );
    return selectedSkillProfile?.profileName;
  }

  @computed((that: CxAgentSession) => [
    that.inboundQueues,
    that.formGroup,
  ])
  get selectedInboundQueues(): string[] {
    const results = (this.formGroup.selectedInboundQueueIds || []).map((id) => {
      return this.inboundQueues.find((queue) => queue.gateId === id);
    });
    return results.filter((result) => result).map((result) => result!.gateName);
  }

  @computed((that: CxAgentSession) => [
    that.selectedInboundQueueIds,
    that.selectedSkillProfileId,
    that.loginType,
    that.extensionNumber,
    that.autoAnswer,
    that.dialGroupId,
    that.formGroup,
  ])
  get isSessionChanged(): boolean {
    const sessionConfigs = {
      selectedInboundQueueIds: this.selectedInboundQueueIds,
      selectedSkillProfileId: this.selectedSkillProfileId,
      loginType: this.loginType,
      extensionNumber: this.extensionNumber,
      autoAnswer: this.autoAnswer,
      dialGroupId: this.dialGroupId,
    };
    return !equals(sessionConfigs, this.formGroup);
  }

  get defaultAutoAnswerOn(): boolean {
    return this.cxAuth.agentPermissions?.defaultAutoAnswerOn || false;
  }

  /**
   * A session needs at least one inbound queue or one dial group, so an
   * outbound-only agent can start a session without any inbound queue.
   */
  get notInboundQueueOrDialGroupSelected(): boolean {
    return (
      this._isInboundQueueMissing(this.formGroup) &&
      this._isDialGroupMissing(this.formGroup)
    );
  }

  @action
  _resetAllConfig() {
    this.selectedInboundQueueIds = [];
    this.selectedSkillProfileId = NONE;
    this.loginType = DEFAULT_LOGIN_TYPE;
    this.extensionNumber = '';
    this.autoAnswer = false;
    this.configSuccess = false;
    this.configured = false;
    this.dialGroupId = this.defaultDialGroupId;
  }

  @delegate('server')
  async resetAllConfig(): Promise<void> {
    this._resetAllConfig();
  }

  @action
  _setConfigSuccess(status: boolean) {
    this.logger.info('setConfigSuccess~', status);
    this.configSuccess = status;
    this.configured = status;
  }

  @action
  _setConfiguring(value: boolean) {
    this.configuring = value;
  }

  @delegate('server')
  async setConfigSuccess(status: boolean): Promise<void> {
    this._setConfigSuccess(status);
  }

  @action
  _setSkillProfileId(skillProfileId: string) {
    this.selectedSkillProfileId = skillProfileId;
  }

  @track((_: CxAgentSession, skillProfileId: string) => [
    trackEvents.agentSessionSetSkillProfileId,
    { value: skillProfileId },
  ])
  @delegate('server')
  async setSkillProfileId(skillProfileId: string): Promise<void> {
    this._setSkillProfileId(skillProfileId);
  }

  @action
  _setInboundQueueIds(ids: string[]) {
    this.selectedInboundQueueIds = ids;
  }

  @track((_: CxAgentSession, ids: string[]) => [
    trackEvents.agentSessionSetInboundQueueIds,
    { value: ids },
  ])
  @delegate('server')
  async setInboundQueueIds(ids: string[]): Promise<void> {
    this._setInboundQueueIds(ids);
  }

  @action
  _setFormGroup(data: FormGroup) {
    this.formGroup = { ...this.formGroup, ...data };
  }

  @delegate('server')
  async setFormGroup(data: FormGroup): Promise<void> {
    this._setFormGroup(data);
  }

  @action
  _assignFormGroupValue() {
    const {
      selectedInboundQueueIds,
      extensionNumber,
      loginType,
      selectedSkillProfileId,
      autoAnswer,
      dialGroupId,
    } = this.formGroup;
    if (selectedInboundQueueIds) {
      this.selectedInboundQueueIds = selectedInboundQueueIds;
    }
    if (extensionNumber !== undefined) {
      this.extensionNumber = extensionNumber;
    }
    if (loginType) {
      this.loginType = loginType;
    }
    if (selectedSkillProfileId) {
      this.selectedSkillProfileId = selectedSkillProfileId;
    }
    if (autoAnswer !== undefined) {
      this.autoAnswer = autoAnswer;
    }
    if (dialGroupId !== undefined) {
      this.dialGroupId = dialGroupId;
    }
  }

  @delegate('server')
  async assignFormGroupValue(): Promise<void> {
    this._assignFormGroupValue();
  }

  @action
  private _setFreshConfig() {
    this.loginType = DEFAULT_LOGIN_TYPE;
    this.extensionNumber = '';
    this.autoAnswer = this.defaultAutoAnswerOn;
    this.configSuccess = false;
    this.configured = false;
    this.selectedSkillProfileId = this.defaultSkillProfileId;
    this.dialGroupId = this.defaultDialGroupId;
    if (this.cxAuth.agentPermissions?.allowInbound) {
      this.selectedInboundQueueIds = this.inboundQueues.map(
        (inboundQueue) => inboundQueue.gateId,
      );
    }
  }

  @delegate('server')
  async setFreshConfig(): Promise<void> {
    this._setFreshConfig();
  }

  @delegate('server')
  async resetFormGroup(): Promise<void> {
    await this.setFormGroup({
      selectedInboundQueueIds: this.selectedInboundQueueIds,
      selectedSkillProfileId: this.selectedSkillProfileId,
      loginType: this.loginType,
      extensionNumber: this.extensionNumber,
      autoAnswer: this.autoAnswer,
      dialGroupId: this.dialGroupId,
    });
  }

  private async _resetAllState(): Promise<void> {
    this.logger.info('_resetAllState~~', this.isMainTab);
    if (!this.isAgentUpdating) {
      await this.resetAllConfig();
    }
    await this._clearCalls();
  }

  /**
   * Clear calls from presence (safe method that checks if presence exists)
   */
  private async _clearCalls(): Promise<void> {
    await this.cxPresence?.clearCalls();
  }

  private _pickSkillProfile(skillProfileList: any[]) {
    return skillProfileList.find((item) => item.isDefault === '1');
  }

  /**
   * Configure agent session
   */
  @track((that: CxAgentSession) => [
    trackEvents.agentSessionConfigureAgent,
    {
      'Voice connection': that.loginType,
      'Skill profile set': !!that.selectedSkillProfile,
      'Inbound queues length': that.selectedInboundQueues.length,
      'Auto answer': that.autoAnswer,
      'Dial group set': !!that.dialGroupId,
      'Dial mode': that.currentDialMode,
    },
  ])
  @delegate('server')
  async configureAgent({
    config: inputConfig,
    triggerEvent = true,
    needAssignFormGroupValue = false,
  }: ConfigureAgentParams = {}): Promise<void> {
    this._setConfiguring(true);
    try {
      let config = inputConfig ?? this._checkFieldsResult(this.formGroup);
      this.logger.info('configureAgent~~', triggerEvent, config);
      await this._clearCalls();
      const connectResult = await this._connectEvServer(config);
      let result = connectResult.result;
      const existingLoginFound = connectResult.existingLoginFound;
      this.logger.info('configureAgent existingLoginFound~~', existingLoginFound);
      // Session timeout - this will occur when stay in session config page for long time
      this.logger.info('configureAgent result.data.status~~', result.data.status);
      if (result.data.status !== 'SUCCESS') {
        this.logger.info('configureAgent result.data', result.data);
        this._navigateToSessionConfigPage();
        this.logger.info('configureAgent newReconnect~~');
        await this.cxAuth.newReconnect(false);
        if (existingLoginFound) {
          config.isForce = true;
        }
        result = (await this._connectEvServer(config)).result;
      }
      await this._handleAgentResult({
        config: result.data as CxAgentConfig,
        needAssignFormGroupValue,
      });
      this.cxAuth.setNotFreshLogin();
      if (triggerEvent) {
        this._emitTriggerConfig();
        await this.setConfigSuccess(true);
      }
      this._emitConfigSuccess();
    } finally {
      this._setConfiguring(false);
    }
  }

  /**
   * Update agent configs from server
   */
  @delegate('server')
  async updateAgentConfigs(): Promise<void> {
    this.logger.info('updateAgentConfigs~~');
    const agentConfig = await this.cxClient.getAgentConfig();
    if (!agentConfig) {
      this.logger.error('updateAgentConfigs: getAgentConfig timed out');
      return;
    }
    const agent = {
      ...this.cxAuth.agent,
      agentConfig,
    };
    await this.cxAuth.setAgent(agent);
    await this.setConfigSuccess(true);
    this._emitConfigSuccess();
  }

  /**
   * Update agent session settings
   */
  @delegate('server')
  async updateAgent(voiceConnectionChanged: boolean): Promise<void> {
    try {
      await this.block.next(async () => {
        const config = this._checkFieldsResult(this.formGroup);
        await this._clearCalls();
        this.isAgentUpdating = true;
        const extensionNumberChanged =
          this.extensionNumber !== this.formGroup.extensionNumber;
        if (voiceConnectionChanged || extensionNumberChanged) {
          await this.reLoginAgent();
        }
        config.isForce = true;
        const { result } = await this._connectEvServer(config);
        await this._handleAgentResult({
          config: result.data as CxAgentConfig,
          isAgentUpdating: true,
          needAssignFormGroupValue: true,
        });
        if (voiceConnectionChanged) {
          this._emitTriggerConfig();
        }
        await this.updateAgentConfigs();
        this._navigateToSettingsPage();
        this._showUpdateSuccessAlert();
      });
    } catch (error) {
      this.logger.error('updateAgent error', error);
      throw error;
    }
  }

  /**
   * Re-login agent with optional alert message
   */
  @delegate('server')
  async reLoginAgent({
    isBlock,
    alertMessage,
  }: {
    isBlock?: boolean;
    alertMessage?: string;
  } = {}): Promise<void> {
    const fn = async () => {
      if (alertMessage) {
        this.toast.danger({ message: alertMessage, ttl: 0 });
      }
      await this.cxAuth.logoutAgent();
      // Wait for server to finish logout
      await sleep(WAIT_EV_SERVER_ROLLBACK_DELAY);
      await this.cxAuth.loginAgent();
    };
    return isBlock ? this.block.next(fn) : fn();
  }

  /**
   * Logout then login again after logout event
   */
  onceLogoutThenLogin(): Promise<Promise<void>> {
    return new Promise<Promise<void>>((resolve) => {
      this.cxAuth.onceLogout(async () => {
        await sleep(WAIT_EV_SERVER_ROLLBACK_DELAY);
        resolve(this.cxAuth.loginAgent());
      });
    });
  }

  private _showUpdateSuccessAlert(): void {
    this.toast.success({
      message: t(messageTypes.UPDATE_AGENT_SUCCESS),
    });
  }

  private _isInboundQueueMissing(formGroup: FormGroup): boolean {
    return (
      !this.cxAuth.agentPermissions?.allowInbound ||
      (formGroup.selectedInboundQueueIds || []).length === 0
    );
  }

  private _isDialGroupMissing(formGroup: FormGroup): boolean {
    return (
      !this.cxAuth.agentPermissions?.allowOutbound || !formGroup.dialGroupId
    );
  }

  private _checkFieldsResult(formGroup: FormGroup): CxConfigureAgentOptions {
    const { selectedInboundQueueIds = [], selectedSkillProfileId } = formGroup;
    if (
      this._isInboundQueueMissing(formGroup) &&
      this._isDialGroupMissing(formGroup)
    ) {
      this.toast.danger({
        message: t(
          this.cxAuth.agentPermissions?.allowOutbound
            ? messageTypes.NOT_INBOUND_QUEUE_OR_DIAL_GROUP_SELECTED
            : messageTypes.NOT_INBOUND_QUEUE_SELECTED,
        ),
        ttl: 0,
      });
      throw new Error(`'queueIds' and 'dialGroupId' are both empty.`);
    }
    const dialDest = this._getDialDest(formGroup);
    return {
      dialDest,
      queueIds: selectedInboundQueueIds,
      skillProfileId:
        selectedSkillProfileId === NONE ? '' : selectedSkillProfileId || '',
      dialGroupId: formGroup.dialGroupId || '',
      loginType: String(formGroup.loginType || ''),
    };
  }

  private _getDialDest(formGroup: FormGroup): string {
    const { loginType, extensionNumber } = formGroup;
    switch (loginType) {
      case loginTypes.external: {
        if (!extensionNumber) {
          this.toast.danger({
            message: t(messageTypes.EMPTY_PHONE_NUMBER),
            ttl: 0,
          });
          throw new Error(`'extensionNumber' is an empty number.`);
        }
        let parsedNumber = '';
        try {
          parsedNumber = parseNumber(extensionNumber);
        } catch (error) {
          this.toast.danger({
            message: t(messageTypes.INVALID_PHONE_NUMBER),
            ttl: 0,
          });
          throw new Error(`'extensionNumber' is not a valid number.`);
        }
        this.setFormGroup({ extensionNumber: parsedNumber });
        return extensionNumber;
      }
      case loginTypes.integrated:
        return 'integrated';
      case loginTypes.RC_PHONE:
      default:
        return 'RC_PHONE';
    }
  }

  private async _handleAgentResult({
    config: { message, status },
    isAgentUpdating,
    needAssignFormGroupValue,
  }: {
    config: CxAgentConfig;
    isAgentUpdating?: boolean;
    needAssignFormGroupValue?: boolean;
  }): Promise<void> {
    this.logger.info('handleAgentResult~~', status, message);
    if (status !== 'SUCCESS') {
      console.error('handleAgentResult error~~', status, message);
      if (typeof message === 'string') {
        this.toast.danger({ message, ttl: 0 });
      } else {
        this.toast.danger({
          message: t(
            isAgentUpdating
              ? messageTypes.UPDATE_AGENT_ERROR
              : messageTypes.AGENT_CONFIG_ERROR,
          ),
          ttl: 0,
        });
      }
      throw new Error(message);
    }
    if (needAssignFormGroupValue) {
      await this.assignFormGroupValue();
    }
  }

  private async _connectEvServer(
    config: CxConfigureAgentOptions,
  ): Promise<{ result: { data: CxAgentConfig | { status: string } }; existingLoginFound: boolean }> {
    const authorized = await this.cxAuth.refreshEvToken();
    if (!authorized) {
      throw new Error(messageTypes.AUTHORIZATION_ERROR);
    }
    let result = await this.cxClient.configureAgent(config);
    if (!result || !result.data) {
      return {
        result: {
          data: {
            status: messageTypes.AUTHORIZATION_ERROR,
          },
        },
        existingLoginFound: false,
      };
    }
    const { status } = result.data;
    this.logger.info('configureAgent status~~', status);
    const existingLoginFound = status === messageTypes.EXISTING_LOGIN_FOUND;
    this.logger.info('_connectEvServer existingLoginFound~~', existingLoginFound);
    if (existingLoginFound) {
      // Dismiss the block spinner overlay so user can interact with the confirmation dialog
      this.block.unblockAll();
      // Show confirmation modal to user
      const confirmed = await this._showMultiLoginConfirm();
      if (!confirmed) {
        this.isForceLogin = false;
        throw new Error(status);
      }
      // If EV client connection was closed, need to re-login first
      if (this.cxClient.appStatus === evStatus.CLOSED) {
        await this.cxAuth.loginAgent();
      }
      // Retry with isForce flag after user confirms
      result = await this.cxClient.configureAgent({
        ...config,
        isForce: true,
      });
      this.isForceLogin = true;
    } else if (status === messageTypes.EXISTING_LOGIN_ENGAGED) {
      this.toast.danger({
        message: t(messageTypes.EXISTING_LOGIN_ENGAGED),
        ttl: 0,
      });
      throw new Error(messageTypes.EXISTING_LOGIN_ENGAGED);
    }
    return { result, existingLoginFound };
  }

  private _emitTriggerConfig() {
    this._eventEmitter.emit(agentSessionEvents.TRIGGER_CONFIG);
  }

  private _emitConfigSuccess() {
    this.logger.info('emitConfigSuccess~~');
    this._eventEmitter.emit(agentSessionEvents.CONFIG_SUCCESS);
  }

  private _emitReConfigFail() {
    this._eventEmitter.emit(agentSessionEvents.RECONFIG_FAIL);
  }

  onTriggerConfig(callback: () => void): this {
    this._eventEmitter.on(agentSessionEvents.TRIGGER_CONFIG, callback);
    return this;
  }

  onConfigSuccess(callback: () => void): this {
    this._eventEmitter.on(agentSessionEvents.CONFIG_SUCCESS, callback);
    return this;
  }

  onReConfigFail(callback: () => void): this {
    this._eventEmitter.on(agentSessionEvents.RECONFIG_FAIL, callback);
    return this;
  }

  /**
   * Initialize agent session (public method for manual initialization)
   */
  async initAgentSession(): Promise<void> {
    await this.block.next(async () => {
      await this._initAgentSession();
    });
  }

  async shouldAutoConfigureAgent(): Promise<boolean> {
    if (this.cxAuth.isFreshLogin) {
      this.logger.info('not auto configure agent because is fresh login');
      return false;
    }
    if (!this.configured) {
      this.logger.info('not auto configure agent because not configured');
      return false;
    }
    return true;
  }

  /**
   * Internal agent session initialization logic
   */
  private async _initAgentSession(): Promise<void> {
    this.logger.info('_initAgentSession~', this.isAgentUpdating);
    if (this.isAgentUpdating) {
      return;
    }
    // Validate stored selections against current agent config
    await this._afterLogin();
    this.logger.info('autoconfig~', !this.cxAuth.isFreshLogin, this.configured);
    // If not fresh login and already configured (and not multi-tab), auto-configure
    const shouldAutoConfigure = await this.shouldAutoConfigureAgent();
    this.logger.info('shouldAutoConfigure~~', shouldAutoConfigure);
    if (shouldAutoConfigure) {
      this._navigateToSessionConfigPage();
      try {
        await this._autoConfigureAgent();
        return;
      } catch (e) {
        this.logger.error('Auto configure failed', e);
      }
    }
    // Otherwise set fresh config and navigate to session config page
    await this._clearCalls();
    await this.setFreshConfig();
    await this.resetFormGroup();
    this._navigateToSessionConfigPage();
  }

  /**
   * Validate stored selections against current agent config after re-login
   */
  private async _afterLogin(): Promise<void> {
    // If not fresh login, validate stored config against current config
    if (!this.cxAuth.isFreshLogin) {
      // Check if selected skill profile is still in the list
      const checkSelectIsInList = this.skillProfileList.some(
        (profile) => profile.profileId === this.selectedSkillProfileId,
      );
      if (!checkSelectIsInList) {
        await this.setSkillProfileId(this.defaultSkillProfileId);
      }
      // Check all selected queues are in inbound queue list
      const checkedInboundQueues = this.selectedInboundQueueIds.reduce<string[]>(
        (result, inboundQueueId) => {
          if (
            this.inboundQueues.some(
              (inboundQueue) => inboundQueue.gateId === inboundQueueId,
            )
          ) {
            result.push(inboundQueueId);
          }
          return result;
        },
        [],
      );
      await this.setInboundQueueIds(checkedInboundQueues);
    }
  }

  /**
   * Auto configure agent with stored settings
   */
  private async _autoConfigureAgent(): Promise<void> {
    this.logger.info('_autoConfigureAgent~');
    const config = await this._checkFieldsResult({
      selectedInboundQueueIds: this.selectedInboundQueueIds,
      selectedSkillProfileId: this.selectedSkillProfileId,
      loginType: this.loginType,
      extensionNumber: this.extensionNumber,
      autoAnswer: this.autoAnswer,
      dialGroupId: this.dialGroupId,
    });
    return this.configureAgent({ config });
  }

  /**
   * A session can start or restore while the user is on another tab, for
   * example when a stored session resumes on reload. Agent pages then have to
   * wait until the user opens the agent tab, where `CxAppView` routes to the
   * page the session state calls for. A session the user just asked for is
   * different: it owns the route and opens its own pages.
   */
  private _navigateWithinAgent(path: string): void {
    if (
      !isCxAgentPath(this.router.currentPath) &&
      !this.cxAuth.setupNavigationRequested
    ) {
      this.logger.info('skip agent navigation outside the agent tab', path);
      return;
    }
    this.cxAuth.completeSetupNavigation();
    this.router.push(path);
  }

  /**
   * Navigate to session config page
   */
  private _navigateToSessionConfigPage(): void {
    this.logger.info('to sessionConfig~~');
    this._navigateWithinAgent(cxPath.sessionConfig());
  }

  /**
   * Check if main tab is alive (for multi-tab support)
   */
  async checkIsMainTabAlive(): Promise<boolean> {
    if (this.portManager?.shared) {
      // In shared mode, defer to port manager
      return true;
    }
    return true;
  }

  /**
   * Navigate to settings page
   */
  _navigateToSettingsPage(): void {
    this.router.push('/settings');
  }

  /**
   * Check if this tab is the main tab
   */
  get isMainTab(): boolean {
    if (this.portManager?.shared) {
      return this.portManager.isServer;
    }
    return true;
  }

  /**
   * Check if tab manager is enabled
   */
  get tabManagerEnabled(): boolean {
    return !!this.portManager?.shared;
  }

  @delegate('server')
  async hasMultipleTabs(): Promise<boolean> {
    if (!this.portManager?.shared) {
      return false;
    }
    return this.portManager?.portDetector?.clientIds?.length > 1;
  }

  /**
   * Check if browser should be blocked on unload
   */
  get shouldBlockBrowser(): boolean {
    return !this.isIntegratedSoftphone;
  }
}

export { CxAgentSession };
