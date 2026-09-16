import type { ToastLevel } from '@ringcentral-integration/micro-core/src/app/services/Toast/Toast.interface';
import { dynamicLoad, useApp } from '@ringcentral/mfe-react';
import type { ThemeType } from '@ringcentral-integration/micro-core/src/app/services/Theme/Theme.interface';
import { useTheme } from '@ringcentral/juno/foundation';
import type { ComponentType, FunctionComponent } from 'react';
import React, { useEffect, useRef, useState } from 'react';

import type { SmartNoteClientInstance } from '../../services/SmartNotes';

interface SmartNotesAlert {
  level: ToastLevel;
  message: string;
}

interface SmartNotesPluginProps {
  client: SmartNoteClientInstance;
  hideContactCard?: boolean;
  hidePostCallHeader?: boolean;
  hidePostCallTabs?: boolean;
  onAlert: (alert: SmartNotesAlert) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  postCallScrollMode?: 'page' | 'panel';
  postCallTab?: 'notes' | 'transcript';
  showCloseButton: boolean;
  theme: ReturnType<typeof useTheme>;
  themeType: ThemeType;
}

interface SmartNotesPanelProps {
  client: SmartNoteClientInstance | null;
  embedded?: boolean;
  onAlert: (alert: SmartNotesAlert) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  remoteEntry: string;
  sessionId: string | null;
  showCloseButton: boolean;
  themeType: ThemeType;
}

const SESSION_SWITCH_DELAY = 50;

const SmartNotesPanelContent: FunctionComponent<SmartNotesPanelProps> = ({
  client,
  embedded = false,
  onAlert,
  onClose,
  onSave,
  remoteEntry,
  sessionId,
  showCloseButton,
  themeType,
}) => {
  const [renderedSessionId, setRenderedSessionId] = useState<string | null>(
    null,
  );
  const sessionIdRef = useRef<string | null>(null);
  const theme = useTheme();
  const SmartNotesPlugin = useApp({
    name: 'SmartNotes',
    loader: () =>
      dynamicLoad('@ringcentral/smart-note-widget/src/bootstrap', remoteEntry),
    attrs: {
      className: embedded
        ? 'h-auto w-full [&>div]:h-auto [&>div]:w-full'
        : 'h-full w-full [&>div]:h-full [&>div]:w-full',
    },
  }) as ComponentType<SmartNotesPluginProps>;

  useEffect(() => {
    if (sessionIdRef.current === sessionId) {
      return undefined;
    }
    sessionIdRef.current = sessionId;
    setRenderedSessionId(null);
    if (!sessionId) {
      return undefined;
    }
    const timeout = setTimeout(() => {
      setRenderedSessionId(sessionId);
    }, SESSION_SWITCH_DELAY);
    return () => clearTimeout(timeout);
  }, [sessionId]);

  if (!renderedSessionId) {
    return null;
  }
  const renderKey = [
    renderedSessionId,
    embedded ? 'embedded' : 'independent',
    showCloseButton ? 'with-close' : 'without-close',
  ].join(':');
  return (
    <SmartNotesPlugin
      key={renderKey}
      client={client}
      hideContactCard={embedded}
      hidePostCallHeader={embedded}
      hidePostCallTabs={false}
      onAlert={onAlert}
      onClose={onClose}
      onSave={onSave}
      postCallScrollMode={embedded ? 'page' : 'panel'}
      postCallTab="notes"
      showCloseButton={embedded ? false : showCloseButton}
      theme={theme}
      themeType={themeType}
    />
  );
};

/**
 * Defers mounting the panel until the smart-notes remote is known.
 *
 * `useApp` runs its loader once on mount with an empty dependency list and never
 * retries, so mounting before `remoteEntry` is resolved fails the import
 * permanently for that instance. The remote entry is per-tab state fetched from
 * `plugins.json`, while call state arrives from the shared worker — so a tab
 * opened during an active call renders the call UI first and would otherwise
 * mount this panel too early.
 */
export const SmartNotesPanel: FunctionComponent<SmartNotesPanelProps> = (
  props,
) => {
  if (!props.client || !props.remoteEntry) {
    return null;
  }
  return <SmartNotesPanelContent {...props} />;
};
