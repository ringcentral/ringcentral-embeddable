import { Theme, Toast } from '@ringcentral-integration/micro-core/src/app/services';
import type { ToastLevel } from '@ringcentral-integration/micro-core/src/app/services/Toast/Toast.interface';
import {
  injectable,
  RcViewModule,
  useConnector,
} from '@ringcentral-integration/next-core';
import React from 'react';

import type { SmartNoteSession } from '../../services/SmartNotes';
import { SmartNotes } from '../../services/SmartNotes';
import { ExpandedView } from '../ExpandedView';
import { SmartNotesPanel } from './SmartNotesPanel';

interface SmartNotesAlert {
  level: ToastLevel;
  message: string;
}

@injectable({
  name: 'SmartNotesView',
})
export class SmartNotesView extends RcViewModule {
  constructor(
    private readonly _expandedView: ExpandedView,
    private readonly _smartNotes: SmartNotes,
    private readonly _theme: Theme,
    private readonly _toast: Toast
  ) {
    super();
  }

  private readonly _expandedHandle = this._expandedView.create({
    id: 'smart-notes',
    showOverlayHeader: false,
    onClose: () => this._handleClose(),
    view: () => {
      const props = useConnector(() => ({
        client: this._smartNotes.smartNoteClient,
        remoteEntry: this._smartNotes.smartNoteMFERemoteEntry,
        sessionId: this._smartNotes.session?.id ?? null,
        themeType: this._theme.themeType,
      }));
      return (
        <SmartNotesPanel
          {...props}
          onAlert={(alert) => this._showAlert(alert)}
          onClose={() => this.close()}
          onSave={() => this._smartNotes.onSmartNoteSave()}
        />
      );
    },
  });

  async open(session: SmartNoteSession): Promise<void> {
    await this._smartNotes.viewSmartNote(session);
    this._expandedView.open(this._expandedHandle, { expand: false });
  }

  close(): void {
    this._expandedView.close(this._expandedHandle);
  }

  private _handleClose(): void {
    if (this._smartNotes.session?.status === 'Disconnected') {
      void this._smartNotes.setSession(null);
    }
  }

  private _showAlert({ level, message }: SmartNotesAlert): void {
    this._toast[level]({ message });
  }

  component(): null {
    return null;
  }
}
