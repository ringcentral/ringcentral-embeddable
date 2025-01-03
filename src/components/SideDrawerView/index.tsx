import React, { useState, useEffect } from 'react';
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
}) {
  const [session, setSession] = useState(null);
  useEffect(() => {
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
      />
    </StyledDrawer>
  );
}
