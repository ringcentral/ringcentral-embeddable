import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2, track } from '@ringcentral-integration/core';
import { trackEvents } from '../Analytics/trackEvents';

@Module({
  name: 'VoicemailDropUI',
  deps: [
    'VoicemailDrop',
    'Webphone',
    'SideDrawerUI',
    'RouterInteraction',
  ],
})
export class VoicemailDropUI extends RcUIModuleV2 {
  constructor(deps) {
    super({
      deps,
    });

    deps.webphone.onCallEnd((session) => {
      const widget = this._deps.sideDrawerUI.widgets.find((w) => {
        return w.id === 'voicemailDrop' && w.params.callSessionId === session.id;
      });
      if (widget) {
        this._deps.sideDrawerUI.closeWidget(widget.id);
      }
    });
  }

  getUIProps() {
    const { voicemailDrop } = this._deps;
    return {
      voicemailMessages: voicemailDrop.allMessages || [],
    };
  }

  @track(trackEvents.dropVoicemailMessage)
  trackDropVoicemailMessage() {}

  getUIFunctions() {
    const { webphone, sideDrawerUI, routerInteraction, voicemailDrop } = this._deps;
    return {
      onDrop: async (callSessionId, voicemailMessageId) => {
        this.trackDropVoicemailMessage();
        const result = await webphone.dropVoicemailMessage(callSessionId, voicemailMessageId);
        if (result) {
          sideDrawerUI.closeWidget('voicemailDrop');
          routerInteraction.push('/dialer');
        }
      },
      onLoad: () => {
        return voicemailDrop.fetchExternalVoicemailDropFiles();
      },
    };
  }
}
