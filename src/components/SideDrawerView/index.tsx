import React, { useState, useEffect, useRef } from 'react';
import { RcDrawer, styled } from '@ringcentral/juno';
import { SmartNoteApp } from './SmartNoteApp';

const StyledDrawer = styled(RcDrawer)`
  height: 100%;
  width: 50%;
  .RcDrawer-paper {
    width: 50%;
  }
`;

export function SideDrawerView({
  smartNoteClient,
  smartNoteSession,
  smartNoteRemoteEntry,
  show,
  onClose,
  onAlert,
  themeType,
  onSmartNoteSave,
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
  if (!show) {
    return null;
  }
  if (!session || !smartNoteClient) {
    return null;
  }
  return (
    <StyledDrawer
      anchor="right"
      variant="permanent"
    >
      <SmartNoteApp
        client={smartNoteClient}
        onClose={onClose}
        onAlert={onAlert}
        smartNoteRemoteEntry={smartNoteRemoteEntry}
        themeType={themeType}
        onSave={onSmartNoteSave}
      />
    </StyledDrawer>
  );
}
