import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  AddVoicemailMd,
  ArrowLeftMd,
  EditMd,
  TrashMd,
  VoicemailMd,
} from '@ringcentral/spring-icon';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  EmptyState,
  FormLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  PageHeader,
  PageHeaderLeft,
  PageHeaderTitle,
  Slider,
  Text,
} from '@ringcentral/spring-ui';
import React, { useEffect, useState } from 'react';

import type { VoicemailMessage } from '../../services/VoicemailDrop/VoicemailDrop.interface';
import i18n from '../VoicemailDropView/i18n';

import { AudioPreview } from './AudioPreview';
import { VoicemailDropMessageEditor } from './VoicemailDropMessageEditor';
import { VOICEMAIL_DROP_LIMITS } from './VoicemailDropSettings.constants';

const NEW_MESSAGE_ID = '__new_voicemail_message__';

function MessageRow({
  message,
  external,
  onEdit,
  onDelete,
}: {
  message: VoicemailMessage;
  external: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useLocale(i18n);
  const source = message.file || message.uri;

  return (
    <ListItem size="auto">
      <div className="min-w-0 flex-1 py-2">
        <ListItemText
          primary={message.label}
          secondary={external ? t('externalMessage') : message.fileName}
          classes={{ primary: 'truncate', secondary: 'truncate' }}
        />
        <div className="mt-2">
          <AudioPreview
            source={source}
            name={message.label}
            playLabel={t('play', { name: message.label })}
            stopLabel={t('stop', { name: message.label })}
          />
        </div>
      </div>
      {!external ? (
        <div className="flex flex-none items-center">
          <IconButton
            variant="icon"
            color="secondary"
            size="small"
            symbol={EditMd}
            TooltipProps={{ title: t('edit', { name: message.label }) }}
            onClick={onEdit}
          />
          <IconButton
            variant="icon"
            color="danger"
            size="small"
            symbol={TrashMd}
            TooltipProps={{ title: t('delete', { name: message.label }) }}
            onClick={onDelete}
          />
        </div>
      ) : null}
    </ListItem>
  );
}

export function VoicemailDropSettingsPanel({
  messages,
  externalMessages,
  noBeepSilenceDuration,
  onBack,
  onDelete,
  onLoad,
  onSave,
  onSilenceDurationChange,
}: {
  messages: VoicemailMessage[];
  externalMessages: VoicemailMessage[];
  noBeepSilenceDuration: number;
  onBack: () => void;
  onDelete: (message: VoicemailMessage) => void;
  onLoad: () => Promise<void>;
  onSave: (message: VoicemailMessage) => void;
  onSilenceDurationChange: (duration: number) => void;
}) {
  const { t } = useLocale(i18n);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VoicemailMessage | null>(
    null,
  );
  const [silenceDuration, setSilenceDuration] = useState(noBeepSilenceDuration);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    void onLoad().catch(() => {
      if (mounted) {
        setLoadFailed(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [onLoad]);

  useEffect(() => {
    setSilenceDuration(noBeepSilenceDuration);
  }, [noBeepSilenceDuration]);

  const editingMessage =
    editingMessageId && editingMessageId !== NEW_MESSAGE_ID
      ? messages.find((message) => message.id === editingMessageId)
      : undefined;

  if (editingMessageId) {
    return (
      <VoicemailDropMessageEditor
        key={editingMessageId}
        message={editingMessage}
        onBack={() => setEditingMessageId(null)}
        onSave={(message) => {
          onSave(message);
          setEditingMessageId(null);
        }}
      />
    );
  }

  const allMessages = [
    ...messages.map((message) => ({ external: false, message })),
    ...externalMessages.map((message) => ({ external: true, message })),
  ];
  const reachedMessageLimit =
    messages.length >= VOICEMAIL_DROP_LIMITS.maxMessages;

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
        <PageHeaderTitle>{t('settingsTitle')}</PageHeaderTitle>
      </PageHeader>
      <div className="flex-auto overflow-y-auto p-4">
        <Alert>{t('settingsInfo')}</Alert>
        {loadFailed ? (
          <Alert severity="error" className="mt-3">
            {t('loadFailed')}
          </Alert>
        ) : null}
        <section className="mt-5" aria-labelledby="voicemail-silence-label">
          <FormLabel id="voicemail-silence-label">
            {t('silenceDuration')}
          </FormLabel>
          <Slider
            className="mt-3"
            aria-labelledby="voicemail-silence-label"
            min={2}
            max={8}
            step={1}
            marks
            value={silenceDuration}
            valueLabelDisplay="on"
            valueLabelFormat={(value) => t('seconds', { count: value })}
            getAriaValueText={(value) => t('seconds', { count: value })}
            onChange={(_, value) => setSilenceDuration(value)}
            onChangeCommitted={(_, value) => onSilenceDurationChange(value)}
          />
          <Text
            component="p"
            className="typography-descriptor mt-3 text-neutral-b2"
          >
            {t('silenceDurationDescription')}
          </Text>
        </section>
        <section className="mt-6" aria-labelledby="voicemail-messages-label">
          <Text
            id="voicemail-messages-label"
            component="h2"
            className="typography-labelSemiBold text-neutral-b0"
          >
            {t('prerecordedMessages')}
          </Text>
          {allMessages.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center">
              <EmptyState
                icon={VoicemailMd}
                title={t('noMessages')}
                description={t('noMessagesDescription')}
              />
            </div>
          ) : (
            <List className="mt-2" aria-label={t('prerecordedMessages')}>
              {allMessages.map(({ external, message }) => (
                <MessageRow
                  key={`${external ? 'external' : 'local'}-${message.id}`}
                  message={message}
                  external={external}
                  onEdit={() => setEditingMessageId(message.id)}
                  onDelete={() => setDeleteTarget(message)}
                />
              ))}
            </List>
          )}
          <Button
            className="mt-4"
            fullWidth
            variant="outlined"
            startIcon={AddVoicemailMd}
            disabled={reachedMessageLimit}
            focusableWhenDisabled
            TooltipProps={
              reachedMessageLimit
                ? {
                    title: t('maxMessages', {
                      count: VOICEMAIL_DROP_LIMITS.maxMessages,
                    }),
                  }
                : undefined
            }
            onClick={() => setEditingMessageId(NEW_MESSAGE_ID)}
          >
            {t('addMessage')}
          </Button>
        </section>
      </div>
      <Dialog
        open={Boolean(deleteTarget)}
        size="small"
        onClose={() => setDeleteTarget(null)}
      >
        <DialogTitle>{t('deleteTitle')}</DialogTitle>
        <DialogContent>
          {deleteTarget
            ? t('deleteDescription', { name: deleteTarget.label })
            : null}
        </DialogContent>
        <DialogActions>
          <Button
            variant="text"
            color="secondary"
            onClick={() => setDeleteTarget(null)}
          >
            {t('cancel')}
          </Button>
          <Button
            color="danger"
            onClick={() => {
              if (deleteTarget) {
                onDelete(deleteTarget);
              }
              setDeleteTarget(null);
            }}
          >
            {t('deleteAction')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
