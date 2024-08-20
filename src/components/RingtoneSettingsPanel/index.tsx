import React, { useState } from 'react';
import { styled, RcButton } from '@ringcentral/juno';
import saveButtonI18n from '@ringcentral-integration/widgets/components/SaveButton/i18n';

import { BackHeaderView } from '../BackHeaderView';
import { Ringtone } from './Ringtone';

const Panel = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 20px 16px;
`;

export const RingtoneSettingsPanel = ({
  onSave,
  currentLocale,
  incomingAudio,
  incomingAudioFile,
  defaultIncomingAudio,
  defaultIncomingAudioFile,
  onBackButtonClick,
  ringtoneDeviceId,
  ringtoneVolume,
}) => {
  const [incomingAudioState, setIncomingAudioState] = useState(incomingAudio);
  const [incomingAudioFileState, setIncomingAudioFileState] = useState(
    incomingAudioFile,
  );
  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title="Ringtone settings"
    >
      <Panel>
        <Ringtone
          showRingToneSettings={true}
          currentLocale={currentLocale}
          incomingAudio={incomingAudioState}
          incomingAudioFile={incomingAudioFileState}
          defaultIncomingAudio={defaultIncomingAudio}
          defaultIncomingAudioFile={defaultIncomingAudioFile}
          setIncomingAudio={({ fileName, dataUrl }) => {
            setIncomingAudioState(dataUrl);
            setIncomingAudioFileState(fileName);
          }}
          resetIncomingAudio={() => {
            setIncomingAudioState(defaultIncomingAudio);
            setIncomingAudioFileState(defaultIncomingAudioFile);
          }}
          ringtoneDeviceId={ringtoneDeviceId}
          ringtoneVolume={ringtoneVolume}
        />
        <br />
        <RcButton
          onClick={() => {
            onSave({
              incomingAudio: incomingAudioState,
              incomingAudioFile: incomingAudioFileState,
            });
          }}
          disabled={
            incomingAudioState === incomingAudio &&
            incomingAudioFileState === incomingAudioFile
          }
          fullWidth
        >
          {saveButtonI18n.getString('save', currentLocale)}
        </RcButton>
      </Panel>
    </BackHeaderView>
  );
}
