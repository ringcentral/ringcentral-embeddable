const directDecorator = (_target, _key, descriptor) => descriptor;

class Auth {
  constructor(
    client,
    toast,
    locale,
    storage,
    root,
    sdkConfig,
    rateLimiter,
    environment,
    analytics,
    authOptions
  ) {
    this._client = client;
    this._authOptions = authOptions;
    this._loggedIn = false;
    this.loggedIn = false;
    this.notLoggedIn = true;
    this.logger = { error: jest.fn(), warn: jest.fn() };
  }

  async onInit() {}

  async fetchToken() {}

  async login() {}

  async logout() {}

  setInitLogin({ loggedIn }) {
    this.loggedIn = loggedIn;
    this.notLoggedIn = !loggedIn;
  }

  setLogin() {}
}

class OAuth {
  constructor(
    client,
    router,
    portManager,
    auth,
    toast,
    locale,
    brand,
    tabManager,
    oAuthOptions
  ) {
    this._client = client;
    this._auth = auth;
    this._oAuthOptions = oAuthOptions;
    this.oAuthReady = false;
    this.logger = { error: jest.fn(), warn: jest.fn() };
    this.baseOpenOAuthPage = jest.fn();
    this.baseCallbackLogin = jest.fn();
  }

  get redirectUri() {
    return new URL(this._oAuthOptions.redirectUri, window.location.href).href;
  }

  async _loginWithCallbackQuery(query) {
    this.baseCallbackLogin(query);
  }

  async getOAuthUri() {
    return 'https://login.example.com/oauth';
  }

  async openOAuthPage() {
    this.baseOpenOAuthPage();
  }
}

class Analytics {
  async track() {}

  async trackOnMainTab() {}
}

class CallLogger {
  constructor(
    storage,
    callHistory,
    callMonitor,
    callLoggerOptions,
    activityMatcher,
    contactMatcher
  ) {
    this._storage = storage;
    this._callHistory = callHistory;
    this._callMonitor = callMonitor;
    this._callLoggerOptions = callLoggerOptions;
    this._activityMatcher = activityMatcher;
    this._contactMatcher = contactMatcher;
    this.ignoredModules = [];
  }

  _ignoreModuleReadiness(module) {
    this.ignoredModules.push(module);
  }

  onInitOnce() {}
}

module.exports = {
  ActivityMatcher: class ActivityMatcher {},
  Analytics,
  AppFeatures: class AppFeatures {},
  Auth,
  Brand: class Brand {},
  CallLog: class CallLog {},
  CallHistory: class CallHistory {},
  CallLogger,
  Call: class Call {},
  CallLogTasks: class CallLogTasks {},
  CallMonitor: class CallMonitor {},
  Client: class Client {},
  ComposeText: class ComposeText {},
  ConnectivityManager: class ConnectivityManager {},
  ConnectivityMonitor: class ConnectivityMonitor {},
  ContactMatcher: class ContactMatcher {},
  ContactSearch: class ContactSearch {},
  Contacts: class Contacts {},
  ConversationMatcher: class ConversationMatcher {},
  Conversations: class Conversations {},
  Environment: class Environment {},
  GenericMeeting: class GenericMeeting {},
  Locale: class Locale {},
  MessageStore: class MessageStore {},
  NumberFormatter: class NumberFormatter {},
  OAuth,
  RateLimiter: class RateLimiter {},
  RegionSettings: class RegionSettings {},
  SmsConversations: class SmsConversations {},
  SmsOptOut: class SmsOptOut {},
  Theme: class Theme {},
  Toast: class Toast {},
  VoicemailAudio: class VoicemailAudio {},
  Webphone: class Webphone {},
  track: () => directDecorator,
};
