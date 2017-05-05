import SDK from 'ringcentral';
import RingCentralClient from 'ringcentral-client';
import { combineReducers } from 'redux';

import RcModule from 'ringcentral-integration/lib/RcModule';

import AccountExtension from 'ringcentral-integration/modules/AccountExtension';
import AccountInfo from 'ringcentral-integration/modules/AccountInfo';
import Alert from 'ringcentral-integration/modules/Alert';
import Auth from 'ringcentral-integration/modules/Auth';
import Brand from 'ringcentral-integration/modules/Brand';
import Call from 'ringcentral-integration/modules/Call';
import CallingSettings from 'ringcentral-integration/modules/CallingSettings';
import ConnectivityMonitor from 'ringcentral-integration/modules/ConnectivityMonitor';
import DialingPlan from 'ringcentral-integration/modules/DialingPlan';
import Environment from 'ringcentral-integration/modules/Environment';
import ExtensionInfo from 'ringcentral-integration/modules/ExtensionInfo';
import ExtensionPhoneNumber from 'ringcentral-integration/modules/ExtensionPhoneNumber';
import ForwardingNumber from 'ringcentral-integration/modules/ForwardingNumber';
import GlobalStorage from 'ringcentral-integration/modules/GlobalStorage';
import Locale from 'ringcentral-integration/modules/Locale';
import RateLimiter from 'ringcentral-integration/modules/RateLimiter';
import RegionSettings from 'ringcentral-integration/modules/RegionSettings';
import Ringout from 'ringcentral-integration/modules/Ringout';
import RolesAndPermissions from 'ringcentral-integration/modules/RolesAndPermissions';
import Softphone from 'ringcentral-integration/modules/Softphone';
import Storage from 'ringcentral-integration/modules/Storage';
import Subscription from 'ringcentral-integration/modules/Subscription';
import TabManager from 'ringcentral-integration/modules/TabManager';
import NumberValidate from 'ringcentral-integration/modules/NumberValidate';
import MessageSender from 'ringcentral-integration/modules/MessageSender';
import ComposeText from 'ringcentral-integration/modules/ComposeText';
import MessageStore from 'ringcentral-integration/modules/MessageStore';
import Messages from 'ringcentral-integration/modules/Messages';
import Conversation from 'ringcentral-integration/modules/Conversation';
import ContactSearch from 'ringcentral-integration/modules/ContactSearch';
import DateTimeFormat from 'ringcentral-integration/modules/DateTimeFormat';
import Conference from 'ringcentral-integration/modules/Conference';

import ActiveCalls from 'ringcentral-integration/modules/ActiveCalls';
import DetailedPresence from 'ringcentral-integration/modules/DetailedPresence';
import CallLog from 'ringcentral-integration/modules/CallLog';
import CallMonitor from 'ringcentral-integration/modules/CallMonitor';
import CallHistory from 'ringcentral-integration/modules/CallHistory';
import ContactMatcher from 'ringcentral-integration/modules/ContactMatcher';
import ActivityMatcher from 'ringcentral-integration/modules/ActivityMatcher';
import CallLogger from 'ringcentral-integration/modules/CallLogger';

import RouterInteraction from 'ringcentral-widget/modules/RouterInteraction';

export default class Phone extends RcModule {
  constructor({
    apiConfig,
    brandConfig,
    appVersion,
    ...options,
  }) {
    super();
    this.addModule('client', new RingCentralClient(new SDK({
      ...options,
      ...apiConfig,
    })));
    this.addModule('alert', new Alert({
      ...options,
      getState: () => this.state.alert,
    }));
    this.addModule('brand', new Brand({
      ...options,
      ...brandConfig,
      getState: () => this.state.brand,
    }));
    this.addModule('softphone', new Softphone({
      ...options,
      brand: this.brand,
    }));
    this.addModule('locale', new Locale({
      ...options,
      getState: () => this.state.locale,
    }));
    this.addModule('dateTimeFormat', new DateTimeFormat({
      ...options,
      locale: this.locale,
      getState: () => this.state.dateTimeFormat,
    }));
    this.addModule('tabManager', new TabManager({
      ...options,
      getState: () => this.state.tabManager,
    }));
    this.addModule('globalStorage', new GlobalStorage({
      ...options,
      getState: () => this.state.globalStorage,
    }));
    this.addModule('environment', new Environment({
      ...options,
      client: this.client,
      globalStorage: this.globalStorage,
      sdkConfig: {
        ...apiConfig,
      },
      getState: () => this.state.environment,
    }));
    this.addModule('auth', new Auth({
      ...options,
      alert: this.alert,
      brand: this.brand,
      client: this.client,
      environment: this.environment,
      locale: this.locale,
      tabManager: this.tabManager,
      getState: () => this.state.auth,
    }));
    this.addModule('ringout', new Ringout({
      ...options,
      auth: this.auth,
      client: this.client,
      getState: () => this.state.ringout,
    }));
    this.addModule('connectivityMonitor', new ConnectivityMonitor({
      ...options,
      alert: this.alert,
      client: this.client,
      environment: this.environment,
      getState: () => this.state.connectivityMonitor,
    }));
    this.addModule('rateLimiter', new RateLimiter({
      ...options,
      alert: this.alert,
      client: this.client,
      environment: this.environment,
      globalStorage: this.globalStorage,
      getState: () => this.state.rateLimiter,
    }));
    this.addModule('storage', new Storage({
      ...options,
      auth: this.auth,
      getState: () => this.state.storage,
    }));
    this.addModule('accountExtension', new AccountExtension({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.accountExtension,
    }));
    this.addModule('accountInfo', new AccountInfo({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.accountInfo,
    }));
    this.addModule('extensionInfo', new ExtensionInfo({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.extensionInfo,
    }));
    this.addModule('rolesAndPermissions', new RolesAndPermissions({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      extensionInfo: this.extensionInfo,
      tabManager: this.tabManager,
      getState: () => this.state.rolesAndPermissions,
    }));
    this.addModule('dialingPlan', new DialingPlan({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.dialingPlan,
    }));
    this.addModule('extensionPhoneNumber', new ExtensionPhoneNumber({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.extensionPhoneNumber,
    }));
    this.addModule('forwardingNumber', new ForwardingNumber({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.forwardingNumber,
    }));
    this.addModule('regionSettings', new RegionSettings({
      ...options,
      storage: this.storage,
      extensionInfo: this.extensionInfo,
      dialingPlan: this.dialingPlan,
      alert: this.alert,
      tabManager: this.tabManager,
      getState: () => this.state.regionSettings,
    }));
    this.addModule('callingSettings', new CallingSettings({
      ...options,
      alert: this.alert,
      brand: this.brand,
      extensionInfo: this.extensionInfo,
      extensionPhoneNumber: this.extensionPhoneNumber,
      forwardingNumber: this.forwardingNumber,
      storage: this.storage,
      rolesAndPermissions: this.rolesAndPermissions,
      tabManager: this.tabManager,
      getState: () => this.state.callingSettings,
    }));
    this.addModule('numberValidate', new NumberValidate({
      ...options,
      client: this.client,
      accountExtension: this.accountExtension,
      regionSettings: this.regionSettings,
      accountInfo: this.accountInfo,
      getState: () => this.state.numberValidate,
    }));
    this.addModule('call', new Call({
      ...options,
      alert: this.alert,
      client: this.client,
      storage: this.storage,
      regionSettings: this.regionSettings,
      callingSettings: this.callingSettings,
      softphone: this.softphone,
      ringout: this.ringout,
      accountExtension: this.accountExtension,
      numberValidate: this.numberValidate,
      extensionPhoneNumber: this.extensionPhoneNumber,
      getState: () => this.state.call,
    }));
    this.addModule('subscription', new Subscription({
      ...options,
      auth: this.auth,
      client: this.client,
      storage: this.storage,
      tabManager: this.tabManager,
      getState: () => this.state.subscription,
    }));
    this.addModule('activeCalls', new ActiveCalls({
      ...options,
      auth: this.auth,
      client: this.client,
      subscription: this.subscription,
      getState: () => this.state.activeCalls,
    }));
    this.addModule('detailedPresence', new DetailedPresence({
      ...options,
      auth: this.auth,
      client: this.client,
      subscription: this.subscription,
      getState: () => this.state.detailedPresence,
    }));
    this.addModule('contactSearch', new ContactSearch({
      ...options,
      auth: this.auth,
      storage: this.storage,
      getState: () => this.state.contactSearch,
    }));
    this.contactSearch.addSearchSource({
      sourceName: 'extensions',
      searchFn: ({ searchString }) => {
        const searchText = searchString.toLowerCase();
        return this.accountExtension.availableExtensions.filter((extension) => {
          if (extension.ext.indexOf(searchText) >= 0) {
            return true;
          }
          if (extension.name.toLowerCase().indexOf(searchText) >= 0) {
            return true;
          }
          return false;
        });
      },
      formatFn: entities => entities.map(entity => ({
        entityType: 'contact',
        name: entity.name,
        phoneNumber: entity.ext,
        phoneType: 'extension',
      })),
      readyCheckFn: () => this.accountExtension.ready,
    });
    this.addModule('messageSender', new MessageSender({
      ...options,
      alert: this.alert,
      client: this.client,
      getState: () => this.state.messageSender,
      extensionPhoneNumber: this.extensionPhoneNumber,
      extensionInfo: this.extensionInfo,
      numberValidate: this.numberValidate,
    }));
    this.addModule('composeText', new ComposeText({
      ...options,
      auth: this.auth,
      alert: this.alert,
      storage: this.storage,
      getState: () => this.state.composeText,
      messageSender: this.messageSender,
      numberValidate: this.numberValidate,
    }));
    this.addModule('messageStore', new MessageStore({
      ...options,
      auth: this.auth,
      storage: this.storage,
      alert: this.alert,
      client: this.client,
      subscription: this.subscription,
      getState: () => this.state.messageStore,
    }));
    this.addModule('conversation', new Conversation({
      ...options,
      auth: this.auth,
      alert: this.alert,
      messageSender: this.messageSender,
      extensionInfo: this.extensionInfo,
      messageStore: this.messageStore,
      getState: () => this.state.conversation,
    }));
    this.addModule('messages', new Messages({
      ...options,
      alert: this.alert,
      messageStore: this.messageStore,
      perPage: 20,
      getState: () => this.state.messages,
    }));
    this.addModule('conference', new Conference({
      ...options,
      auth: this.auth,
      client: this.client,
      regionSettings: this.regionSettings,
      getState: () => this.state.conference,
    }));
    this.addModule('router', new RouterInteraction({
      ...options,
      getState: () => this.state.router,
    }));
    this.addModule('callLog', new CallLog({
      ...options,
      auth: this.auth,
      client: this.client,
      subscription: this.subscription,
      storage: this.storage,
      rolesAndPermissions: this.rolesAndPermissions,
      getState: () => this.state.callLog,
    }));
    this.addModule('callMonitor', new CallMonitor({
      ...options,
      accountInfo: this.accountInfo,
      detailedPresence: this.detailedPresence,
      activeCalls: this.activeCalls,
      activityMatcher: this.activityMatcher,
      contactMatcher: this.contactMatcher,
      onRinging: async () => {
        // TODO refactor some of these logic into appropriate modules
        this.router.history.push('/calls');
      },
      getState: () => this.state.callMonitor,
    }));
    this.addModule('callHistory', new CallHistory({
      ...options,
      accountInfo: this.accountInfo,
      callLog: this.callLog,
      callMonitor: this.callMonitor,
      activityMatcher: this.activityMatcher,
      contactMatcher: this.contactMatcher,
      getState: () => this.state.callHistory,
    }));
    this.addModule('contactMatcher', new ContactMatcher({
      ...options,
      storage: this.storage,
      getState: () => this.state.contactMatcher,
    }));
    this.addModule('activityMatcher', new ActivityMatcher({
      ...options,
      storage: this.storage,
      getState: () => this.state.activityMatcher,
    }));
    this.addModule('callLogger', new CallLogger({
      ...options,
      storage: this.storage,
      callMonitor: this.callMonitor,
      contactMatcher: this.contactMatcher,
      activityMatcher: this.activityMatcher,
      getState: () => this.state.callLogger,
    }));
    this._reducer = combineReducers({
      accountExtension: this.accountExtension.reducer,
      accountInfo: this.accountInfo.reducer,
      alert: this.alert.reducer,
      auth: this.auth.reducer,
      app: (state = {
        name: brandConfig.appName,
        version: appVersion,
      }) => state,
      call: this.call.reducer,
      callingSettings: this.callingSettings.reducer,
      connectivityMonitor: this.connectivityMonitor.reducer,
      environment: this.environment.reducer,
      extensionInfo: this.extensionInfo.reducer,
      extensionPhoneNumber: this.extensionPhoneNumber.reducer,
      forwardingNumber: this.forwardingNumber.reducer,
      brand: this.brand.reducer,
      dialingPlan: this.dialingPlan.reducer,
      locale: this.locale.reducer,
      storage: this.storage.reducer,
      globalStorage: this.globalStorage.reducer,
      detailedPresence: this.detailedPresence.reducer,
      rateLimiter: this.rateLimiter.reducer,
      rolesAndPermissions: this.rolesAndPermissions.reducer,
      regionSettings: this.regionSettings.reducer,
      ringout: this.ringout.reducer,
      router: this.router.reducer,
      subscription: this.subscription.reducer,
      tabManager: this.tabManager.reducer,
      dateTimeFormat: this.dateTimeFormat.reducer,
      contactSearch: this.contactSearch.reducer,
      numberValidate: this.numberValidate.reducer,
      messageSender: this.messageSender.reducer,
      composeText: this.composeText.reducer,
      messageStore: this.messageStore.reducer,
      conversation: this.conversation.reducer,
      messages: this.messages.reducer,
      conference: this.conference.reducer,
      activeCalls: this.activeCalls.reducer,
      callLog: this.callLog.reducer,
      callMonitor: this.callMonitor.reducer,
      callHistory: this.callHistory.reducer,
      contactMatcher: this.contactMatcher.reducer,
      activityMatcher: this.activityMatcher.reducer,
      callLogger: this.callLogger.reducer,
      lastAction: (state = null, action) => {
        console.log(action);
        return action;
      },
    });
  }

  get name() {
    return this.state.app.name;
  }

  get version() {
    return this.state.app.version;
  }
}
