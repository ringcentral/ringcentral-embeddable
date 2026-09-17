import {
  AppFeatures,
  Auth,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { CallingSettings } from '@ringcentral-integration/micro-phone/src/app/services';
import { callingModes } from '@ringcentral-integration/micro-phone/src/app/services/CallingSettings/callingModes';
import {
  dynamic,
  injectable,
  RcViewModule,
  type UIFunctions,
  type UIProps,
  useConnector,
} from '@ringcentral-integration/next-core';
import { useObservableState } from 'observable-hooks';
import React, { useRef } from 'react';

import { AudioInit } from '../../services/AudioInit';
import type { AppFeatures as EmbeddableAppFeatures } from '../../services/AppFeatures';
import { TabManager } from '../../services/TabManager';
import { AudioInitPanel } from './AudioInitPanel';
import type { AudioInitViewProps } from './AudioInitView.interface';

interface CxSoftphoneAudioState {
  readonly isIntegratedSoftphone: boolean;
  readonly sipState: 'idle' | 'registered' | 'registering';
  readonly sipUnstableConnection: boolean;
}

@injectable({
  name: 'AudioInitView',
})
export class AudioInitView extends RcViewModule {
  @dynamic('CxIntegratedSoftphone')
  private readonly _cxSoftphone?: CxSoftphoneAudioState;

  constructor(
    private readonly _audioInit: AudioInit,
    private readonly _appFeatures: AppFeatures,
    private readonly _auth: Auth,
    private readonly _callingSettings: CallingSettings,
    private readonly _tabManager: TabManager,
  ) {
    super();
  }

  getUIProps(): UIProps<AudioInitViewProps> {
    const appFeatures = this._appFeatures as EmbeddableAppFeatures;
    const needsPhoneAudio =
      this._tabManager.fromPopup ||
      (this._auth.loggedIn &&
        this._callingSettings.callingMode === callingModes.webphone);
    const needsRingCXAudio =
      this._auth.loggedIn &&
      this._cxSoftphone?.isIntegratedSoftphone === true &&
      this._cxSoftphone.sipState === 'registered' &&
      !this._cxSoftphone.sipUnstableConnection;
    return {
      show:
        appFeatures.showAudioInitPrompt &&
        (needsPhoneAudio || needsRingCXAudio),
    };
  }

  getUIFunctions(): UIFunctions<AudioInitViewProps> {
    return {
      onEnableAudio: (): void => {
        void this._audioInit.enableAudio();
      },
    };
  }

  component(
    props?: Pick<AudioInitViewProps, 'className'>,
  ): React.ReactElement | null {
    const { current: uiFunctions } = useRef(this.getUIFunctions());
    const { show } = useConnector(() => this.getUIProps());
    const isAudioEnabled = useObservableState(
      this._audioInit.isAudioEnabled$,
      this._audioInit.isAudioEnabled,
    );
    if (!show || isAudioEnabled) {
      return null;
    }
    return <AudioInitPanel {...props} {...uiFunctions} />;
  }
}
