import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

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

  getUIFunctions() {
    const { webphone, sideDrawerUI, routerInteraction, voicemailDrop } = this._deps;
    return {
      onDrop: async (callSessionId, voicemailMessageId) => {
        await webphone.dropVoicemailMessage(callSessionId, voicemailMessageId);
        sideDrawerUI.closeWidget('voicemailDrop');
        routerInteraction.push('/dialer');
      },
      onLoad: () => {
        return voicemailDrop.fetchExternalVoicemailDropFiles();
      },
    };
  }
}
