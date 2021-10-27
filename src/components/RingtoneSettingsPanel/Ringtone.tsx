import React, { FunctionComponent, useState, useEffect, useRef } from 'react';
import { useIsMounted } from '@ringcentral-integration/widgets/react-hooks/useIsMounted';
import {
  RcCard,
  RcCardContent,
  RcText,
  RcIconButton,
  RcGrid,
} from '@ringcentral/juno';
import Play from '@ringcentral/juno/icon/Play';
import Attachment from '@ringcentral/juno/icon/Attachment';
import Delete from '@ringcentral/juno/icon/Delete';
import Pause from '@ringcentral/juno/icon/Pause';

import i18n from '@ringcentral-integration/widgets/components/Ringtone/i18n';

import { AudioFileReaderProps, RingtoneProps } from '@ringcentral-integration/widgets/components/Ringtone/Ringtone.interface';

import styles from './styles.scss';

const AudioFileReader: FunctionComponent<AudioFileReaderProps> = ({
  currentLocale,
  defaultFileName,
  defaultDataUrl,
  fileName = null,
  dataUrl = null,
  onChange,
  onReset,
}) => {
  const isMountedRef = useIsMounted();
  const audioElRef = useRef(null);
  const inputElRef = useRef(null);
  const [playState, setPlayState] = useState(false);

  useEffect(() => {
    audioElRef.current.pause();
    audioElRef.current.currentTime = 0;
    setPlayState(false);
  }, [dataUrl]);

  const resetButton =
    fileName !== defaultFileName || dataUrl !== defaultDataUrl ? (
      <RcIconButton
        symbol={Delete}
        onClick={onReset}
        title={i18n.getString('reset', currentLocale)}
      />
    ) : null;

  return (
    <RcGrid container>
      <RcGrid item xs={8} className={styles.fileName}>
        <RcText variant="body1">
          {fileName}
        </RcText>
      </RcGrid>
      <RcGrid item xs={4}>
        <div className={styles.buttonGroup}>
          <RcIconButton
            symbol={playState ? Pause : Play}
            onClick={async () => {
              if (audioElRef.current) {
                if (playState) {
                  audioElRef.current.pause();
                } else {
                  try {
                    audioElRef.current.currentTime = 0;
                    await audioElRef.current.play();
                  } catch (err) {
                    if (isMountedRef.current) {
                      console.log(err);
                      console.log(
                        'Failed to play audio, please select a different file',
                      );
                    }
                  }
                }
              }
            }}
            title={playState
              ? i18n.getString('stop', currentLocale)
              : i18n.getString('play', currentLocale)
            }
          />
          <RcIconButton
            symbol={Attachment}
            onClick={() => {
              if (inputElRef.current) {
                inputElRef.current.click();
              }
            }}
            title={i18n.getString('upload', currentLocale)}
          />
          {resetButton}
        </div>
      </RcGrid>
      <input
        ref={inputElRef}
        className={styles.hidden}
        type="file"
        accept="audio/*"
        onChange={({ currentTarget }) => {
          if (currentTarget.files.length) {
            const file = currentTarget.files[0];
            const fileSize = Math.round((file.size / 1024));
            if (fileSize >= 8192) {
              console.error('input file is too big, select a file less than 8mb');
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (isMountedRef.current) {
                onChange({
                  fileName: file.name,
                  dataUrl: reader.result as string,
                });
                // reset input
                currentTarget.value = null;
              }
            };
            reader.readAsDataURL(file);
          }
        }}
      />
      <audio
        ref={audioElRef}
        className={styles.hidden}
        src={dataUrl}
        onPlay={() => {
          setPlayState(true);
        }}
        onPause={() => {
          setPlayState(false);
        }}
      />
    </RcGrid>
  );
};

export const Ringtone: FunctionComponent<RingtoneProps> = ({
  currentLocale,
  incomingAudio,
  incomingAudioFile,
  defaultIncomingAudio,
  defaultIncomingAudioFile,
  showRingToneSettings,
  setIncomingAudio,
  resetIncomingAudio,
}) => {
  if (!showRingToneSettings) {
    return null;
  }
  return (
    // newline
    <div>
      <RcCard>
        <RcCardContent>
          <RcText variant="subheading2">
            {i18n.getString('incomingRingtone', currentLocale)}
          </RcText>
          <AudioFileReader
            currentLocale={currentLocale}
            fileName={incomingAudioFile}
            dataUrl={incomingAudio}
            defaultFileName={defaultIncomingAudioFile}
            defaultDataUrl={defaultIncomingAudio}
            onChange={({ fileName, dataUrl }) => {
              setIncomingAudio({ fileName, dataUrl });
            }}
            onReset={resetIncomingAudio}
          />
        </RcCardContent>
      </RcCard>
    </div>
  );
};
