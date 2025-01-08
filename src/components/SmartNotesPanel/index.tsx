import React, { useState, useEffect, useRef } from 'react';
import { SmartNoteApp } from './SmartNoteApp';

export function SmartNotesPanel({
  smartNoteClient,
  smartNoteSession,
  smartNoteRemoteEntry,
  onClose,
  onAlert,
  themeType,
  onSave,
}) {
  const [session, setSession] = useState(null);
  const sessionRef = useRef(session);

  useEffect(() => {
    if (
      sessionRef.current &&
      smartNoteSession &&
      sessionRef.current.id === smartNoteSession.id
    ) {
      // avoid re-render when session is the same
      return;
    }
    sessionRef.current = smartNoteSession;
    setSession(null);
    const timeout = setTimeout(() => {
      setSession(smartNoteSession);
    }, 50);
    return () => {
      clearTimeout(timeout);
    };
  }, [smartNoteSession]);

  useEffect(() => {
    console.log('SmartNotesPanel mounted');
  }, []);

  if (!session || !smartNoteClient) {
    return null;
  }

  return (
    <SmartNoteApp
      client={smartNoteClient}
      onClose={onClose}
      onAlert={onAlert}
      smartNoteRemoteEntry={smartNoteRemoteEntry}
      themeType={themeType}
      onSave={onSave}
    />
  );
}
