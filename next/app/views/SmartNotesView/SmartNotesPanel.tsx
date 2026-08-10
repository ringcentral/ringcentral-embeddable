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
  onAlert: (alert: SmartNotesAlert) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  showCloseButton: boolean;
  theme: ReturnType<typeof useTheme>;
  themeType: ThemeType;
}

interface SmartNotesPanelProps {
  client: SmartNoteClientInstance | null;
  onAlert: (alert: SmartNotesAlert) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
  remoteEntry: string;
  sessionId: string | null;
  themeType: ThemeType;
}

const SESSION_SWITCH_DELAY = 50;

export const SmartNotesPanel: FunctionComponent<SmartNotesPanelProps> = ({
  client,
  onAlert,
  onClose,
  onSave,
  remoteEntry,
  sessionId,
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
      dynamicLoad(
        '@ringcentral/smart-note-widget/src/bootstrap',
        remoteEntry
      ),
    attrs: {
      className: 'h-full w-full [&>div]:h-full [&>div]:w-full',
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

  if (!client || !remoteEntry || !renderedSessionId) {
    return null;
  }
  return (
    <SmartNotesPlugin
      key={renderedSessionId}
      client={client}
      onAlert={onAlert}
      onClose={onClose}
      onSave={onSave}
      showCloseButton
      theme={theme}
      themeType={themeType}
    />
  );
};
