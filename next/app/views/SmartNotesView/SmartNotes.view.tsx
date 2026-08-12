import {
  Theme,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import type { ToastLevel } from '@ringcentral-integration/micro-core/src/app/services/Toast/Toast.interface';
import {
  injectable,
  RcViewModule,
  useConnector,
  watch,
} from '@ringcentral-integration/next-core';
import React from 'react';

import type { SmartNoteSession } from '../../services/SmartNotes';
import { SmartNotes } from '../../services/SmartNotes';
import { ExpandedView } from '../ExpandedView';
import {
  SideWidgetView,
  type SideWidgetContentViewProps,
} from '../SideWidgetView';
import { SmartNotesPanel } from './SmartNotesPanel';

interface SmartNotesAlert {
  level: ToastLevel;
  message: string;
}

interface SmartNotesConnectedPanelProps {
  onAlert: (alert: SmartNotesAlert) => void;
  onClose: () => void;
  showCloseButton: boolean;
  smartNotes: SmartNotes;
  theme: Theme;
}

const SmartNotesConnectedPanel = ({
  onAlert,
  onClose,
  showCloseButton,
  smartNotes,
  theme,
}: SmartNotesConnectedPanelProps) => {
  const props = useConnector(() => ({
    client: smartNotes.smartNoteClient,
    remoteEntry: smartNotes.smartNoteMFERemoteEntry,
    sessionId: smartNotes.session?.id ?? null,
    themeType: theme.themeType,
  }));
  return (
    <SmartNotesPanel
      {...props}
      onAlert={onAlert}
      onClose={onClose}
      onSave={() => smartNotes.onSmartNoteSave()}
      showCloseButton={showCloseButton}
    />
  );
};

@injectable({
  name: 'SmartNotesView',
})
export class SmartNotesView extends RcViewModule {
  constructor(
    private readonly _expandedView: ExpandedView,
    private readonly _sideWidgetView: SideWidgetView,
    private readonly _smartNotes: SmartNotes,
    private readonly _theme: Theme,
    private readonly _toast: Toast
  ) {
    super();
  }

  private _stopWatchingSession: (() => void) | null = null;

  private _presentedSessionId: string | null = null;

  override onInit(): void {
    this._stopWatchingSession = watch(
      this,
      () => this._smartNotes.session,
      (session) => this._handleSessionChange(session)
    );
  }

  override onReset(): void {
    this._stopWatchingSession?.();
    this._stopWatchingSession = null;
    this.close();
  }

  private readonly _contentView = ({
    showCloseButton = true,
  }: Partial<SideWidgetContentViewProps>) => (
    <SmartNotesConnectedPanel
      smartNotes={this._smartNotes}
      theme={this._theme}
      onAlert={(alert) => this._showAlert(alert)}
      onClose={() => this.close()}
      showCloseButton={showCloseButton}
    />
  );

  private readonly _sideWidgetHandle = this._sideWidgetView.createContent({
    id: 'smart-notes',
    name: 'AI Assistant',
    onClose: () => this._handleClose(),
    view: this._contentView,
  });

  private readonly _expandedHandle = this._expandedView.create({
    id: 'smart-notes',
    showOverlayHeader: false,
    onClose: () => this._handleClose(),
    view: this._contentView,
  });

  async open(session: SmartNoteSession): Promise<void> {
    const openInSideWidget =
      session.status !== 'Disconnected' || this._sideWidgetView.isOpen;
    this._presentedSessionId = session.id;
    try {
      await this._smartNotes.viewSmartNote(session);
      if (this._presentedSessionId !== session.id) {
        return;
      }
      this._showSession(session, openInSideWidget);
    } catch (error) {
      if (this._presentedSessionId === session.id) {
        this._presentedSessionId = null;
      }
      throw error;
    }
  }

  close(): void {
    this._presentedSessionId = null;
    this._sideWidgetView.closeContent(this._sideWidgetHandle);
    this._expandedView.close(this._expandedHandle);
  }

  private _handleSessionChange(session: SmartNoteSession | null): void {
    if (!session) {
      this.close();
      return;
    }
    if (this._presentedSessionId === session.id) {
      return;
    }
    this._presentedSessionId = session.id;
    this._showSession(session);
  }

  private _showSession(
    session: SmartNoteSession,
    openInSideWidget?: boolean
  ): void {
    const shouldOpenInSideWidget =
      openInSideWidget ??
      (session.status !== 'Disconnected' || this._sideWidgetView.isOpen);
    if (shouldOpenInSideWidget) {
      this._sideWidgetView.openContent(this._sideWidgetHandle);
      return;
    }
    this._expandedView.open(this._expandedHandle, { expand: false });
  }

  private _handleClose(): void {
    this._presentedSessionId = null;
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
