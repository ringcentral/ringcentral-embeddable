import React from 'react';
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
  show,
  onClose,
  onAlert,
}) {
  if (!show) {
    return null;
  }
  if (!smartNoteSession || !smartNoteClient) {
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
      />
    </StyledDrawer>
  );
}
