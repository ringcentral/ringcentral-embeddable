import CallLogSectionModule from 'ringcentral-widgets/modules/CallLogSection';
import { Module } from 'ringcentral-integration/lib/di';

/**
 * @class CallLogSection
 * @extends {CallLogSectionModule}
 * @description Call log section popup managing module
 */
@Module({
  deps: ['ThirdPartyService'],
})
export default class CallLogSection extends CallLogSectionModule {
  constructor({
    thirdPartyService,
    ...options
  }) {
    super({
      ...options
    });
    this._thirdPartyService = thirdPartyService;
  }

  _readyCheckFunction() {
    return this._thirdPartyService.callLoggerRegistered;
  }

  _onSuccess() {
    this.closeLogSection();
  }

  _onError() {
    return null;
  }

  async _logFunction(_identify, call, note) {
    try {
      await this._thirdPartyService.logCall({ call, note });
      return true;
    } catch (e) {
      return false;
    }
  }

  _showLogSection(identify, call) {
    if (!this.show || identify !== this.currentIdentify) {
      this.store.dispatch({
        type: this.actionTypes.showLogSection,
        identify,
        call,
      });
    }
  }

  async handleLogSection(call) {
    const { sessionId } = call;
    super.handleLogSection(sessionId);
  }
}
