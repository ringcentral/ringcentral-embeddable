import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  inject,
  injectable,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
  watch,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import { VoicemailDrop } from '../../services/VoicemailDrop';
import type { Webphone } from '../../services/WebphoneV2';
import {
  SideWidgetView,
  type SideWidgetContentViewProps,
} from '../SideWidgetView';

import { VoicemailDropPanel } from './VoicemailDropPanel';
import { t } from './i18n';

@injectable({
  name: 'VoicemailDropView',
})
export class VoicemailDropView extends RcViewModule {
  constructor(
    private _sideWidgetView: SideWidgetView,
    private _voicemailDrop: VoicemailDrop,
    @inject(MicroPhoneWebphone) private _webphone: Webphone,
    private _router: RouterPlugin,
  ) {
    super();
  }

  @state
  currentSessionId: string | null = null;

  private _stopWatchingSession: (() => void) | null = null;

  override onInit(): void {
    this._stopWatchingSession = watch(
      this,
      () =>
        [
          this.currentSessionId,
          this.currentSessionId === null ||
            this._webphone.sessions.some(
              ({ id }) => id === this.currentSessionId,
            ),
        ] as const,
      ([sessionId, sessionAvailable]) => {
        if (sessionId && !sessionAvailable) {
          this.close();
        }
      },
      { multiple: true },
    );
  }

  override onReset(): void {
    this._stopWatchingSession?.();
    this._stopWatchingSession = null;
    if (this.currentSessionId) {
      this.close();
    }
    this._setCurrentSessionId(null);
  }

  @action
  private _setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  open(sessionId: string): void {
    if (!this._voicemailDrop.hasVoicemailDropPermission) {
      return;
    }
    this._sideWidgetView.openContent(this._sideWidgetHandle);
    this._setCurrentSessionId(sessionId);
  }

  close(): void {
    this._sideWidgetView.closeContent(this._sideWidgetHandle);
  }

  private async _dropMessage(messageId: string): Promise<boolean> {
    const sessionId = this.currentSessionId;
    if (!sessionId) {
      return false;
    }
    const dropped = await this._webphone.dropVoicemailMessage(
      sessionId,
      messageId,
    );
    if (dropped) {
      this.close();
      this._router.push('/dialer');
    }
    return dropped;
  }

  private async _loadMessages(): Promise<void> {
    await this._voicemailDrop.fetchExternalVoicemailDropFiles();
  }

  private readonly _sideWidgetHandle = this._sideWidgetView.createContent({
    id: 'voicemail-drop',
    name: t('voicemailDrop'),
    onClose: () => this._setCurrentSessionId(null),
    view: ({ showCloseButton }: SideWidgetContentViewProps) => {
      const uiProps = useConnector(() => ({
        messages: this._voicemailDrop.allMessages.slice(),
      }));
      const { current: uiFunctions } = useRef({
        onClose: () => this.close(),
        onDrop: (messageId: string) => this._dropMessage(messageId),
        onLoad: () => this._loadMessages(),
      });

      return (
        <VoicemailDropPanel
          messages={uiProps.messages}
          showCloseButton={showCloseButton}
          {...uiFunctions}
        />
      );
    },
  });

  component() {
    return null;
  }
}
