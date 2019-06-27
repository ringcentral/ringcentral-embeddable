import { Module } from 'ringcentral-integration/lib/di';
import ConversationLoggerBase from 'ringcentral-integration/modules/ConversationLogger';

@Module({
  deps: [
    'ThirdPartyService'
  ],
})
export default class ConversationLogger extends ConversationLoggerBase {
  constructor({
    thirdPartyService,
    ...options
  }) {
    super({
      initialState: { autoLog: false },
      readyCheckFunction: () => true,
      logFunction: async (data) => { await this._doLog(data); },
      ...options,
    });
    this._thirdPartyService = thirdPartyService;
  }

  async _doLog(conversation) {
    console.log(conversation);
    //
  }

  get logButtonTitle() {
    return this._thirdPartyService.messageLoggerTitle;
  }

  get loggerSourceReady() {
    return this._thirdPartyService.messageLoggerRegistered;
  }
}
