import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { ArrowLeftMd, AttachMd } from '@ringcentral/spring-icon';
import {
  Alert,
  Button,
  IconButton,
  PageHeader,
  PageHeaderLeft,
  PageHeaderTitle,
  Text,
  TextField,
} from '@ringcentral/spring-ui';
import React, { useRef, useState } from 'react';

import type { VoicemailMessage } from '../../services/VoicemailDrop/VoicemailDrop.interface';
import i18n from '../VoicemailDropView/i18n';

import { AudioPreview } from './AudioPreview';
import { validateVoicemailDropFile } from './VoicemailDropSettings.helper';

type EditorError =
  | 'fileRequired'
  | 'fileTooLarge'
  | 'invalidFileType'
  | 'nameRequired'
  | 'readFileFailed';

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Audio file did not produce a data URL'));
    });
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

export function VoicemailDropMessageEditor({
  message,
  onBack,
  onSave,
}: {
  message?: VoicemailMessage;
  onBack: () => void;
  onSave: (message: VoicemailMessage) => void;
}) {
  const { t } = useLocale(i18n);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [label, setLabel] = useState(message?.label ?? '');
  const [fileName, setFileName] = useState(message?.fileName ?? '');
  const [fileData, setFileData] = useState(message?.file);
  const [error, setError] = useState<EditorError | null>(null);
  const [readingFile, setReadingFile] = useState(false);

  const onFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    const validationError = validateVoicemailDropFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setReadingFile(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFileData(dataUrl);
      setFileName(file.name);
    } catch {
      setError('readFileFailed');
    } finally {
      setReadingFile(false);
    }
  };

  const save = (): void => {
    const normalizedLabel = label.trim();
    if (!normalizedLabel) {
      setError('nameRequired');
      return;
    }
    if (!fileData) {
      setError('fileRequired');
      return;
    }
    onSave({
      id: message?.id ?? `${Date.now()}`,
      label: normalizedLabel,
      file: fileData,
      fileName,
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-base">
      <PageHeader className="flex-none border-b border-neutral-l02">
        <PageHeaderLeft>
          <IconButton
            variant="icon"
            color="secondary"
            size="medium"
            symbol={ArrowLeftMd}
            TooltipProps={{ title: t('back') }}
            onClick={onBack}
          />
        </PageHeaderLeft>
        <PageHeaderTitle>
          {t(message ? 'editMessage' : 'newMessage')}
        </PageHeaderTitle>
      </PageHeader>
      <div className="flex-auto overflow-y-auto p-4">
        {error ? <Alert severity="error">{t(error)}</Alert> : null}
        <TextField
          className={error ? 'mt-3' : undefined}
          fullWidth
          required
          clearBtn={false}
          label={t('messageName')}
          value={label}
          inputProps={{ maxLength: 100 }}
          onChange={(event) => {
            setLabel(event.target.value);
            setError(null);
          }}
        />
        <div className="mt-5">
          <Text
            component="div"
            className="typography-labelSemiBold text-neutral-b0"
          >
            {t('audioFile')}
          </Text>
          <Text
            component="div"
            className="typography-descriptor mt-1 text-neutral-b2"
          >
            {t('audioFileHelp')}
          </Text>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav"
            onChange={(event) => void onFileChange(event)}
          />
          <Button
            className="mt-3"
            variant="outlined"
            startIcon={AttachMd}
            loading={readingFile}
            onClick={() => fileInputRef.current?.click()}
          >
            {t(fileData ? 'replaceAudioFile' : 'chooseAudioFile')}
          </Button>
          {fileName ? (
            <Text
              component="div"
              className="typography-descriptor mt-2 truncate text-neutral-b2"
              title={fileName}
            >
              {fileName}
            </Text>
          ) : null}
          <div className="mt-3">
            <AudioPreview
              source={fileData}
              name={label || t('audioFile')}
              playLabel={t('play', { name: label || t('audioFile') })}
              stopLabel={t('stop', { name: label || t('audioFile') })}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-none justify-end gap-2 border-t border-neutral-l02 p-4">
        <Button variant="text" color="secondary" onClick={onBack}>
          {t('cancel')}
        </Button>
        <Button disabled={readingFile} onClick={save}>
          {t('save')}
        </Button>
      </div>
    </div>
  );
}
