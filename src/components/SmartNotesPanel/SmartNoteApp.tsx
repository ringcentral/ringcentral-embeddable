import React from 'react';
import { dynamicLoad, useApp } from '@ringcentral/mfe-react';
import { styled, useTheme } from '@ringcentral/juno/foundation';

const Container = styled.div`
  width: 100%;
  height: 100%;
  
  .smart-note-app {
    width: 100%;
    height: 100%;

    > div {
      width: 100%;
      height: 100%;
    }
  }
`;

export function SmartNoteApp({
  client,
  onClose,
  onAlert,
  smartNoteRemoteEntry,
  themeType,
  onSave,
}) {
  const theme = useTheme();
  const SmartNotePlugin = useApp({
    name: 'SmartNotes',
    loader: () => {
      console.log('loading smart note');
      return dynamicLoad(
        '@ringcentral/smart-note-widget/src/bootstrap',
        smartNoteRemoteEntry,
      );
    },
    attrs: {
      className: 'smart-note-app',
    },
    bootstrap: async (platform) => {},
  });
  return (
    <Container>
      <SmartNotePlugin
        client={client}
        onClose={onClose}
        onAlert={onAlert}
        theme={theme}
        themeType={themeType}
        onSave={onSave}
      />
    </Container>
  );
}
