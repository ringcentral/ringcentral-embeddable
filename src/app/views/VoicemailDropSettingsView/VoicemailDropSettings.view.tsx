import {
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import {
  VoicemailDrop,
  type VoicemailMessage,
} from '../../services/VoicemailDrop';

import { VoicemailDropSettingsPanel } from './VoicemailDropSettingsPanel';

@injectable({
  name: 'VoicemailDropSettingsView',
})
export class VoicemailDropSettingsView extends RcViewModule {
  constructor(
    private _voicemailDrop: VoicemailDrop,
    private _router: RouterPlugin,
  ) {
    super();
  }

  component() {
    const uiProps = useConnector(() => ({
      messages: this._voicemailDrop.voicemailMessages.slice(),
      externalMessages: this._voicemailDrop.externalVoicemailDropFiles.slice(),
      noBeepSilenceDuration: this._voicemailDrop.noBeepSilenceDuration,
    }));
    const { current: uiFunctions } = useRef({
      onBack: () => this._router.push('/settings'),
      onDelete: (message: VoicemailMessage) =>
        void this._voicemailDrop.deleteVoicemailMessage(message),
      onLoad: () => this._voicemailDrop.fetchExternalVoicemailDropFiles(),
      onSave: (message: VoicemailMessage) =>
        void this._voicemailDrop.addVoicemailMessage(message),
      onSilenceDurationChange: (duration: number) =>
        void this._voicemailDrop.setNoBeepSilenceDuration(duration),
    });

    return <VoicemailDropSettingsPanel {...uiProps} {...uiFunctions} />;
  }
}
