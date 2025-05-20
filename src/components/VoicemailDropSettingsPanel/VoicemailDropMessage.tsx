import React, { useState, useRef, useEffect } from 'react';
import {
  styled,
  RcTextField,
  RcButton,
  RcIconButton,
  RcTypography,
  useAudio,
  useMountState,
} from '@ringcentral/juno';
import { Attachment, Play, Pause } from '@ringcentral/juno-icon';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
`;

const HiddenInput = styled.input`
  display: none;
`;

const FileUploader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 16px;
`;

const StyledTextField = styled(RcTextField)`
  margin-bottom: 16px;
`;

function canSave(message, label, file) {
  const labelTrimmed = label.trim();
  if (message.id) {
    return !!labelTrimmed && (
      message.label !== labelTrimmed ||
      message.file !== file
    );
  }
  return !!labelTrimmed && !!file;
}

export const VoicemailDropMessage = ({
  message,
  onSave,
}) => {
  const [label, setLabel] = useState(message.label || '');
  const [file, setFile] = useState(message.file || null);
  const [fileName, setFileName] = useState(message.fileName || '');
  const fileUploadRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audio = useAudio((a) => {
    a.onplay = () => setIsPlaying(true);
    a.onpause = () => setIsPlaying(false);

    if (message && message.file) {
      a.src = message.file;
    }
  });
  const isMountedRef = useMountState();

  useEffect(() => {
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    
    if (file) {
      audio.src = file;
    }
  }, [audio, file]);

  return (
    <Container>
      <StyledTextField
        label="Label"
        value={label}
        fullWidth
        onChange={(e) => {
          setLabel(e.target.value);
        }}
      />
      <FileUploader>
        <RcTypography variant="body1">{fileName ? fileName : 'Upload .WAV or .MP3 file'}</RcTypography>
        {
          file && (
            <RcIconButton
              symbol={isPlaying ? Pause : Play}
              title={isPlaying ? 'Pause' : 'Play'}
              onClick={() => {
                if (isPlaying) {
                  audio.pause();
                } else {
                  audio.play();
                }
                setIsPlaying(!isPlaying);
              }}
            />
          )
        }
        <RcIconButton
          symbol={Attachment}
          onClick={() => {
            fileUploadRef.current.click();
          }}
          title={file ? 'Change file' : 'Upload file'}
        />
      </FileUploader>
      <HiddenInput
        type="file"
        ref={fileUploadRef}
        onChange={(e) => {
          if (e.currentTarget.files.length === 0) {
            return;
          }
          const file = e.currentTarget.files[0];
          const fileSize = Math.round((file.size / 1024));
          if (fileSize >= 8192) {
            console.error('input file is too big, select a file less than 8mb');
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            if (isMountedRef.current) {
              setFile(reader.result as string);
              setFileName(file.name);
            }
          };
          reader.readAsDataURL(file);
        }}
        accept=".wav,.mp3"
      />
      <RcButton
        fullWidth
        onClick={() => {
          onSave({
            id: message.id,
            label,
            file: file !== message.file ? file : null,
            fileName: fileName !== message.fileName ? fileName : null,
          });
        }}
        disabled={!canSave(message, label, file)}
      >
        Save
      </RcButton>
    </Container>
  );
};
