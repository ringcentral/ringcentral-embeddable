import { track } from '@ringcentral-integration/micro-auth/src/app/services';
import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  delegate,
  inject,
  injectable,
  PortManager,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
  watch,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';

import { embeddableTrackEvents } from '../../services/Analytics/embeddableTrackEvents';
import { VoicemailDrop } from '../../services/VoicemailDrop';
import type { Webphone } from '../../services/WebphoneV2';
import {
  SideWidgetView,
  type SideWidgetCloseTabOptions,
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
    private _portManager: PortManager,
  ) {
    super();
  }

  @state
  currentSessionId: string | null = null;

  private _stopWatchingSession: (() => void) | null = null;

  override onInit(): void {
    // The tab and its call are server state, so only the server closes it.
    if (this._portManager.shared && !this._portManager.isServer) return;
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
          // The call ending, not the user, closes the picker, so a drawer it
          // leaves empty folds.
          void this.close({ collapseWhenLast: true });
        }
      },
      { multiple: true },
    );
  }

  override onReset(): void {
    this._stopWatchingSession?.();
    this._stopWatchingSession = null;
    if (this.currentSessionId) {
      void this.close({ collapseWhenLast: true });
    }
    this._setCurrentSessionId(null);
  }

  @action
  private _setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  /**
   * Runs on the server port, which owns the side widget tabs. Opened only on
   * the client, the tab and its call would be replaced by the server's next
   * tab update, such as AI Assistant's, and never close when the call ends.
   */
  @delegate('server')
  @track(embeddableTrackEvents.openVoicemailDrop)
  async open(sessionId: string): Promise<void> {
    if (!this._voicemailDrop.hasVoicemailDropPermission) {
      return;
    }
    this._sideWidgetView.openContent(this._sideWidgetHandle);
    this._setCurrentSessionId(sessionId);
  }

  @delegate('server')
  async close(options?: SideWidgetCloseTabOptions): Promise<void> {
    this._sideWidgetView.closeContent(this._sideWidgetHandle, options);
  }

  @track(embeddableTrackEvents.dropVoicemailMessage)
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
      void this.close();
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
    getName: () => t('voicemailDrop'),
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
