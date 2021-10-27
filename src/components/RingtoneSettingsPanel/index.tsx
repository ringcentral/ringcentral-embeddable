import React, { useState } from 'react';
import BackHeader from '@ringcentral-integration/widgets/components/BackHeader';
import Panel from '@ringcentral-integration/widgets/components/Panel';
import SaveButton from '@ringcentral-integration/widgets/components/SaveButton';

import { Ringtone } from './Ringtone';

import styles from './styles.scss';

export const RingtoneSettingsPanel = ({
  onSave,
  currentLocale,
  incomingAudio,
  incomingAudioFile,
  defaultIncomingAudio,
  defaultIncomingAudioFile,
  onBackButtonClick,
}) => {
  const [incomingAudioState, setIncomingAudioState] = useState(incomingAudio);
  const [incomingAudioFileState, setIncomingAudioFileState] = useState(
    incomingAudioFile,
  );
  return (
    <div
      className={styles.root}
    >
      <BackHeader onBackClick={onBackButtonClick}>
        Ringtone Settings
      </BackHeader>
      <Panel className={styles.content}>
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
        />
        <br />
        <SaveButton
          currentLocale={currentLocale}
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
        />
      </Panel>
    </div>
  );
}
