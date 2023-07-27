import { CallLogSection as CallLogSectionBase } from '@ringcentral-integration/widgets/modules/CallLogSection';
import { Module } from '@ringcentral-integration/commons/lib/di';

/**
 * @class CallLogSection
 * @extends {CallLogSectionBase}
 * @description Call log section popup managing module
 */
@Module({
  deps: ['ThirdPartyService'],
})
export class CallLogSection extends CallLogSectionBase {
  constructor(deps) {
    super(deps);
    this.addLogHandler({
      logFunction: async (_identify, call, note) => {
        try {
          await this._deps.thirdPartyService.logCall({ call, note });
          return true;
        } catch (e) {
          return false;
        }
      },
      readyCheckFunction: () => this._deps.thirdPartyService.callLoggerRegistered,
      onSuccess: () => this.closeLogSection(),
      onError: () => null,
      onUpdate: () => null, // TODO: update log section
    });
  }

  // _showLogSection(identify, call) {
  //   if (!this.show || identify !== this.currentIdentify) {
  //     this.store.dispatch({
  //       type: this.actionTypes.showLogSection,
  //       identify,
  //       call,
  //     });
  //   }
  // }

  async handleLogSection(call) {
    const { sessionId } = call;
    super.handleLogSection(sessionId);
  }
}
