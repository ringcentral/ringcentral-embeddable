import {
  Theme,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import type { ToastLevel } from '@ringcentral-integration/micro-core/src/app/services/Toast/Toast.interface';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { HistoryCall } from '@ringcentral-integration/micro-phone/src/app/services';
import {
  delegate,
  injectable,
  PortManager,
  RcViewModule,
  useConnector,
  watch,
} from '@ringcentral-integration/next-core';
import clsx from 'clsx';
import React, { useEffect, useMemo } from 'react';

import type { SmartNoteSession } from '../../services/SmartNotes';
import { SmartNotes } from '../../services/SmartNotes';
import {
  SideWidgetView,
  type SideWidgetCloseTabOptions,
  type SideWidgetContentViewProps,
} from '../SideWidgetView';
import { SmartNotesPanel } from './SmartNotesPanel';
import { createEmbeddedHistorySmartNoteSession } from './create-embedded-history-smart-note-session';
import i18n, { t } from './i18n';

/** The session, not the user, closes the tab. */
const SESSION_CLOSE: SideWidgetCloseTabOptions = { collapseWhenLast: true };

interface SmartNotesAlert {
  level: ToastLevel;
  message: string;
}

interface SmartNotesConnectedPanelProps {
  embedded?: boolean;
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
  embedded = false,
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
      embedded={embedded}
      onAlert={onAlert}
      onClose={onClose}
      onSave={() => smartNotes.onSmartNoteSave()}
      showCloseButton={showCloseButton}
    />
  );
};

interface SmartNotesViewProps {
  className?: string;
  embedded?: boolean;
  info?: HistoryCall;
  mode?: 'in-call' | 'post-call';
  variant?: 'expanded' | 'history' | 'postCall';
  'data-sign'?: string;
  'data-tab-type'?: string;
}

@injectable({
  name: 'SmartNotesView',
})
export class SmartNotesView extends RcViewModule {
  constructor(
    private readonly _sideWidgetView: SideWidgetView,
    private readonly _smartNotes: SmartNotes,
    private readonly _theme: Theme,
    private readonly _toast: Toast,
    private readonly _portManager: PortManager,
  ) {
    super();
  }

  private _stopWatchingSession: (() => void) | null = null;

  /**
   * The session this port presents. On the server it keeps the session watcher
   * from presenting a session twice; on the client it drops a stale `open()`.
   */
  private _presentedSessionId: string | null = null;

  override onInit(): void {
    // The tab is server state, so only the server follows the session.
    if (this._portManager.shared && !this._portManager.isServer) return;
    this._stopWatchingSession = watch(
      this,
      () =>
        [this._smartNotes.session, this._smartNotes.presentation] as const,
      ([session]) => this._handleSessionChange(session),
      { multiple: true },
    );
  }

  override onReset(): void {
    this._stopWatchingSession?.();
    this._stopWatchingSession = null;
    this.close(SESSION_CLOSE);
  }

  private readonly _contentView = ({
    showCloseButton,
  }: SideWidgetContentViewProps) => (
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
    name: t('aiAssistant'),
    getName: () => t('aiAssistant'),
    onClose: () => this._handleClose(),
    showAppsTab: true,
    view: this._contentView,
  });

  /**
   * Presents a session the user chose. The tab is shown on the server port,
   * which owns the side widget tabs; shown only on this client, the server's
   * next tab update would replace it.
   */
  async open(session: SmartNoteSession): Promise<void> {
    const openInSideWidget =
      session.status !== 'Disconnected' || this._sideWidgetView.isOpen;
    this._presentedSessionId = session.id;
    try {
      // Claimed first, so the server's watcher does not present the session
      // on its own once loading it sets it.
      await this._presentOnServer(session.id);
      await this._smartNotes.viewSmartNote(session);
      if (this._presentedSessionId !== session.id) {
        return;
      }
      await this._showSessionOnServer(session, openInSideWidget);
    } catch (error) {
      if (this._presentedSessionId === session.id) {
        this._presentedSessionId = null;
      }
      throw error;
    }
  }

  /**
   * Closes the tab. The user closing it keeps a docked drawer open on its blank
   * view; the session ending, which the user did not ask for, folds a drawer
   * it leaves empty (`collapseWhenLast`).
   */
  close({ collapseWhenLast }: SideWidgetCloseTabOptions = {}): void {
    this._presentedSessionId = null;
    void this._closeOnServer(collapseWhenLast);
  }

  @delegate('server')
  private async _presentOnServer(sessionId: string): Promise<void> {
    this._presentedSessionId = sessionId;
  }

  @delegate('server')
  private async _showSessionOnServer(
    session: SmartNoteSession,
    openInSideWidget: boolean,
  ): Promise<void> {
    this._presentedSessionId = session.id;
    this._showSession(session, openInSideWidget);
  }

  @delegate('server')
  private async _closeOnServer(collapseWhenLast?: boolean): Promise<void> {
    this._presentedSessionId = null;
    this._sideWidgetView.closeContent(this._sideWidgetHandle, {
      collapseWhenLast,
    });
  }

  private _handleSessionChange(session: SmartNoteSession | null): void {
    if (!session) {
      this.close(SESSION_CLOSE);
      return;
    }
    if (this._smartNotes.presentation === 'embedded') {
      this.close(SESSION_CLOSE);
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
    openInSideWidget?: boolean,
  ): void {
    const docked =
      openInSideWidget ??
      (session.status !== 'Disconnected' || this._sideWidgetView.isOpen);
    // A past session opens without widening the app or bringing the call's
    // Apps tab along; while folded, the drawer shows it as an overlay.
    this._sideWidgetView.updateContent(this._sideWidgetHandle, {
      ...this._sideWidgetHandle.options,
      showAppsTab: docked,
    });
    this._sideWidgetView.openContent(
      this._sideWidgetHandle,
      docked ? {} : { expand: false },
    );
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

  private async _openEmbeddedSession(
    session: SmartNoteSession,
  ): Promise<void> {
    await this._smartNotes.viewSmartNote(session, 'embedded');
  }

  component({
    className,
    'data-sign': dataSign,
    'data-tab-type': dataTabType,
    embedded = false,
    info,
    mode,
  }: SmartNotesViewProps): React.ReactElement | null {
    const { t } = useLocale(i18n);
    const session = useMemo(
      () => createEmbeddedHistorySmartNoteSession(info),
      [info],
    );
    const panelProps = useConnector(() => ({
      client: this._smartNotes.smartNoteClient,
      remoteEntry: this._smartNotes.smartNoteMFERemoteEntry,
      sessionId: this._smartNotes.session?.id ?? null,
      themeType: this._theme.themeType,
    }));
    useEffect(() => {
      if (!embedded || mode !== 'post-call' || !session) {
        return undefined;
      }
      let isMounted = true;
      void this._openEmbeddedSession(session)
        .then(() => {
          if (
            !isMounted &&
            this._smartNotes.presentation === 'embedded' &&
            this._smartNotes.session?.id === session.id
          ) {
            void this._smartNotes.setSession(null);
          }
        })
        .catch((error: unknown) => {
          this.logger.error('Failed to embed Smart Notes', error);
          this._showAlert({
            level: 'warning',
            message: t('loadFailed'),
          });
        });
      return () => {
        isMounted = false;
        if (
          this._smartNotes.presentation === 'embedded' &&
          this._smartNotes.session?.id === session.id
        ) {
          void this._smartNotes.setSession(null);
        }
      };
    }, [embedded, mode, session, t]);
    if (!embedded || mode !== 'post-call' || !session) {
      return null;
    }
    return (
      <div
        className={clsx('min-h-0 w-full flex-none', className)}
        data-sign={dataSign}
        data-tab-type={dataTabType}
      >
        <SmartNotesPanel
          {...panelProps}
          embedded
          onAlert={(alert) => this._showAlert(alert)}
          onClose={() => undefined}
          onSave={() => this._smartNotes.onSmartNoteSave()}
          showCloseButton={false}
        />
      </div>
    );
  }
}
