import React, { useState, useRef } from 'react';
import {
  styled,
  RcTextField,
  RcButton,
  RcIconButton,
  RcTypography,
  useMountState,
} from '@ringcentral/juno';
import { Attachment } from '@ringcentral/juno-icon';
import { AudioPlayer } from '../AudioPlayer';

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

const StyledAudioPlayer = styled(AudioPlayer)`
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
  currentLocale,
}) => {
  const [label, setLabel] = useState(message.label || '');
  const [file, setFile] = useState(message.file || message.uri || null);
  const [fileName, setFileName] = useState(message.fileName || '');
  const fileUploadRef = useRef(null);

  const isMountedRef = useMountState();

  const isExternal = !!message.uri;

  return (
    <Container>
      <StyledTextField
        label="Label"
        value={label}
        fullWidth
        onChange={(e) => {
          setLabel(e.target.value);
        }}
        disabled={isExternal}
      />
      {
        !isExternal && (
          <FileUploader>
            <RcTypography variant="body1">{fileName && file ? fileName : 'Upload .WAV or .MP3 file (max 8MB)'}</RcTypography>
            <RcIconButton
              symbol={Attachment}
              onClick={() => {
                fileUploadRef.current.click();
              }}
              title={file ? 'Change file' : 'Upload file'}
            />
          </FileUploader>
        )
      }
      {
        file && (
          <StyledAudioPlayer
            uri={file}
            currentLocale={currentLocale}
          />
        )
      }
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
      {
        !isExternal && (
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
        )
      }
    </Container>
  );
};
