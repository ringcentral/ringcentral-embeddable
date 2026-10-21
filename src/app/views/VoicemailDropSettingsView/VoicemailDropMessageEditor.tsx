import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { AttachMd } from '@ringcentral/spring-icon';
import { Alert, Button, Icon, Text, TextField } from '@ringcentral/spring-ui';
import React, { useRef, useState } from 'react';

import type { VoicemailMessage } from '../../services/VoicemailDrop/VoicemailDrop.interface';
import { useSideWidgetTabsShown } from '../SideWidgetView/useSideWidgetTabsShown';
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
  const tabsShown = useSideWidgetTabsShown();
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
    <>
      {/* The side widget tab already names the page and hides the back
          button. */}
      {tabsShown ? null : (
        <AppHeaderNav override>
          <PageHeader onBackClick={onBack}>
            {t(message ? 'editMessage' : 'newMessage')}
          </PageHeader>
        </AppHeaderNav>
      )}
      <div
        data-sign="voicemailDropMessageEditorContent"
        className="flex-auto overflow-y-auto overflow-x-hidden px-4 py-2"
      >
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
          {/* Styled like the text field label above it. */}
          <Text
            id="voicemail-audio-file-label"
            component="div"
            className="typography-descriptorMiniSemiBold text-neutral-b0"
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
          {fileData ? (
            // The file, its replace action and its preview read as one unit.
            <div
              className="mt-2 rounded-lg border border-neutral-l02 px-3 py-2"
              role="group"
              aria-labelledby="voicemail-audio-file-label"
            >
              <div className="flex min-w-0 items-center gap-2">
                <Icon
                  symbol={AttachMd}
                  size="small"
                  className="text-neutral-b2"
                  aria-hidden
                />
                <Text
                  component="span"
                  className="typography-descriptor min-w-0 flex-1 truncate text-neutral-b0"
                  title={fileName}
                >
                  {fileName || t('audioFile')}
                </Text>
                <Button
                  className="shrink-0"
                  variant="text"
                  size="small"
                  loading={readingFile}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('replaceAudioFile')}
                </Button>
              </div>
              <div className="mt-1">
                <AudioPreview
                  source={fileData}
                  name={label || t('audioFile')}
                  playLabel={t('play', { name: label || t('audioFile') })}
                  stopLabel={t('stop', { name: label || t('audioFile') })}
                />
              </div>
            </div>
          ) : (
            <Button
              className="mt-2"
              variant="outlined"
              startIcon={AttachMd}
              loading={readingFile}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('chooseAudioFile')}
            </Button>
          )}
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
      <AppFooterNav />
    </>
  );
}
