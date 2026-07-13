import { Webphone as MicroPhoneWebphone } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  action,
  inject,
  injectable,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useEffect, useRef } from 'react';

import { VoicemailDrop } from '../../services/VoicemailDrop';
import type { Webphone } from '../../services/WebphoneV2';
import { ExpandedView } from '../ExpandedView';

import { VoicemailDropPanel } from './VoicemailDropPanel';

@injectable({
  name: 'VoicemailDropView',
})
export class VoicemailDropView extends RcViewModule {
  constructor(
    private _expandedView: ExpandedView,
    private _voicemailDrop: VoicemailDrop,
    @inject(MicroPhoneWebphone) private _webphone: Webphone,
    private _router: RouterPlugin,
  ) {
    super();
  }

  @state
  currentSessionId: string | null = null;

  @action
  private _setCurrentSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  open(sessionId: string): void {
    if (!this._voicemailDrop.hasVoicemailDropPermission) {
      return;
    }
    this._setCurrentSessionId(sessionId);
    this._expandedView.open(this._expandedHandle);
  }

  close(): void {
    this._expandedView.close();
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

  private readonly _expandedHandle = this._expandedView.create({
    onClose: () => this._setCurrentSessionId(null),
    view: () => {
      const uiProps = useConnector(() => ({
        messages: this._voicemailDrop.allMessages.slice(),
        sessionId: this.currentSessionId,
        sessionAvailable: this._webphone.sessions.some(
          (session) => session.id === this.currentSessionId,
        ),
      }));
      const { current: uiFunctions } = useRef({
        onClose: () => this.close(),
        onDrop: (messageId: string) => this._dropMessage(messageId),
        onLoad: () => this._loadMessages(),
      });

      useEffect(() => {
        if (uiProps.sessionId && !uiProps.sessionAvailable) {
          this.close();
        }
      }, [uiProps.sessionAvailable, uiProps.sessionId]);

      return (
        <VoicemailDropPanel messages={uiProps.messages} {...uiFunctions} />
      );
    },
  });

  component() {
    return null;
  }
}
