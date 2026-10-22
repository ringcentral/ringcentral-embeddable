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

/**
 * Drops a message on a RingCX call and resolves to whether it started. The
 * RingCX chunk supplies it, because only the chunk knows the CX call.
 */
export type CxVoicemailDropHandler = (
  cxCallId: string,
  messageId: string,
) => Promise<boolean>;

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

  /** The RingCX call the picker is open for, instead of a RingEX session. */
  @state
  currentCxCallId: string | null = null;

  private _stopWatchingSession: (() => void) | null = null;

  /** Per port: the picker runs its drop on the port that shows it. */
  private _cxDropHandler: CxVoicemailDropHandler | null = null;

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
    if (this.currentSessionId || this.currentCxCallId) {
      void this.close({ collapseWhenLast: true });
    }
    this._setTarget({ sessionId: null, cxCallId: null });
  }

  @action
  private _setTarget({
    sessionId,
    cxCallId,
  }: {
    sessionId: string | null;
    cxCallId: string | null;
  }): void {
    this.currentSessionId = sessionId;
    this.currentCxCallId = cxCallId;
  }

  /** Lets the RingCX chunk run drops for the CX calls it opens the picker for. */
  setCxDropHandler(handler: CxVoicemailDropHandler | null): void {
    this._cxDropHandler = handler;
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
    this._setTarget({ sessionId, cxCallId: null });
  }

  /** Opens the picker for a RingCX call. See {@link open} for the port. */
  @delegate('server')
  @track(embeddableTrackEvents.openVoicemailDrop)
  async openForCxCall(cxCallId: string): Promise<void> {
    if (!this._voicemailDrop.hasVoicemailDropPermission) {
      return;
    }
    this._sideWidgetView.openContent(this._sideWidgetHandle);
    this._setTarget({ sessionId: null, cxCallId });
  }

  /** Closes the picker if it is open for this RingCX call, e.g. when it ends. */
  @delegate('server')
  async closeForCxCall(cxCallId: string): Promise<void> {
    if (this.currentCxCallId !== cxCallId) return;
    this._sideWidgetView.closeContent(this._sideWidgetHandle, {
      collapseWhenLast: true,
    });
  }

  @delegate('server')
  async close(options?: SideWidgetCloseTabOptions): Promise<void> {
    this._sideWidgetView.closeContent(this._sideWidgetHandle, options);
  }

  @track(embeddableTrackEvents.dropVoicemailMessage)
  private async _dropMessage(messageId: string): Promise<boolean> {
    if (this.currentCxCallId) {
      return this._dropCxMessage(this.currentCxCallId, messageId);
    }
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

  /**
   * The agent stays on the CX call page, which shows the drop status, so the
   * picker only closes.
   */
  private async _dropCxMessage(
    cxCallId: string,
    messageId: string,
  ): Promise<boolean> {
    if (!this._cxDropHandler) {
      return false;
    }
    const dropped = await this._cxDropHandler(cxCallId, messageId);
    if (dropped) {
      void this.close();
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
    onClose: () => this._setTarget({ sessionId: null, cxCallId: null }),
    view: ({ showCloseButton }: SideWidgetContentViewProps) => {
      const uiProps = useConnector(() => ({
        messages: this._voicemailDrop.allMessages.slice(),
        forCxCall: Boolean(this.currentCxCallId),
      }));
      const { current: uiFunctions } = useRef({
        onClose: () => this.close(),
        onDrop: (messageId: string) => this._dropMessage(messageId),
        onLoad: () => this._loadMessages(),
      });

      return (
        <VoicemailDropPanel
          messages={uiProps.messages}
          forCxCall={uiProps.forCxCall}
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
