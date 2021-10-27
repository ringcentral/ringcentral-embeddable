import Raven from 'raven-js';
import { Module } from '@ringcentral-integration/commons/lib/di';
import RcModule from '@ringcentral-integration/commons/lib/RcModule';

/**
 * Error Logger based on Raven.js
 */
@Module({
  deps: [
    { dep: 'Auth', optional: true },
    { dep: 'ErrorLoggerOptions', optional: true },
  ],
})
class ErrorLogger extends RcModule {
  constructor({
    auth,
    version,
    endpoint,
    sampleRate = 1,
    ...options
  }) {
    super({
      ...options,
    });

    this._auth = auth;
    this._version = version;
    this._endpoint = endpoint;
    this._sampleRate = sampleRate;
    this._isReady = false;

    if (this._endpoint) {
      this._bootstrap();
      this.setTags({ version });
    }

    this._loggedIn = false;
  }

  _bootstrap() {
    Raven.config(this._endpoint, this._config).install();
    this._isReady = true;

    // Most of the code are wrapped by Promise,
    // capture uncaught error in Promise if possible
    window.onunhandledrejection = (evt) => {
      Raven.captureException(evt.reason);
    };
  }

  get _actionTypes() {
    /* no action types */
    return null;
  }

  _onStateChange() {
    if (
      this._endpoint
      && this._auth
    ) {
      const loggedInChanged = (this._loggedIn !== this._auth.loggedIn);
      if (loggedInChanged) {
        this._loggedIn = this._auth.loggedIn;
        this.setUser({
          id: this._auth.ownerId,
        });
      }
    }
  }

  /**
   * @setUser
   * @param {Object} userInfo - params object
   * @param {String} userInfo.id - user id
   * @param {String} userInfo.email - user email
   * @param {String} userInfo.username - user name
   */
  setUser(userInfo) {
    if (this._isReady) {
      Raven.setUserContext(userInfo);
    }
  }

  setTags(tags) {
    if (this._isReady) {
      Raven.setTagsContext(tags);
    }
  }

  log(message, options) {
    if (this._isReady) {
      Raven.captureMessage(message, options);
    }
  }

  /**
   * @params {Error} error
   * @params {Object} options
   */
  logError(error, options) {
    if (this._isReady) {
      Raven.captureException(error, options);
    }
  }

  /**
   * Expose raven instance
   * @return {Raven}
   */
  get _raven() {
    return Raven;
  }

  /**
   * Additional configurations for Sentry
   * https://docs.sentry.io/clients/javascript/config/#optional-settings
   */
  get _config() {
    return {
      release: this._version || '',
      ignoreErrors: [
        '200 OK',
        'Failed to fetch',
        'Request Timeout',
        'Service is overloaded',
        'In order to call this API endpoint, user needs to have [ReadCallLog] permission for requested resource',
        'INVALID_STATE_ERROR: Invalid status: 11',
        'INVALID_STATE_ERROR: Invalid status: 1',
        'rateLimiterErrorMessages-rateLimitReached',
      ],
      // Should not log console to protect privacy
      autoBreadcrumbs: {
        xhr: true, // XMLHttpRequest
        console: false, // console logging
        dom: true, // DOM interactions, i.e. clicks/typing
        location: true, // url changes, including pushState/popState
        sentry: true, // sentry events
      },
      sampleRate: this._sampleRate,
    };
  }

  test(str = '[sentry test error]') {
    Raven.captureException(new Error(str));
  }
}

export default ErrorLogger;
