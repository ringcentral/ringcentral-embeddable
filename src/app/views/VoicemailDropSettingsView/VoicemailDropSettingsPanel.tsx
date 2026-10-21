import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import {
  AddVoicemailMd,
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
  Slider,
  Text,
} from '@ringcentral/spring-ui';
import React, { useEffect, useState } from 'react';

import type { VoicemailMessage } from '../../services/VoicemailDrop/VoicemailDrop.interface';
import { useSideWidgetTabsShown } from '../SideWidgetView/useSideWidgetTabsShown';
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
        <div className="flex min-w-0 items-center gap-2">
          <ListItemText
            primary={message.label}
            secondary={external ? t('externalMessage') : message.fileName}
            classes={{
              root: 'min-w-0 flex-1',
              primary: 'truncate',
              secondary: 'truncate',
            }}
          />
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
                color="secondary"
                size="small"
                symbol={TrashMd}
                TooltipProps={{ title: t('delete', { name: message.label }) }}
                onClick={onDelete}
              />
            </div>
          ) : null}
        </div>
        <div className="mt-1">
          <AudioPreview
            source={source}
            name={message.label}
            playLabel={t('play', { name: message.label })}
            stopLabel={t('stop', { name: message.label })}
          />
        </div>
      </div>
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
  const tabsShown = useSideWidgetTabsShown();
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
    <>
      {/* The side widget tab already names the page and hides the back
          button. */}
      {tabsShown ? null : (
        <AppHeaderNav override>
          <PageHeader onBackClick={onBack}>{t('settingsTitle')}</PageHeader>
        </AppHeaderNav>
      )}
      {/* Lists run edge to edge: their items carry their own inset. */}
      <div
        data-sign="voicemailDropSettingsContent"
        className="flex-auto overflow-y-auto overflow-x-hidden py-4"
      >
        {loadFailed ? (
          <div className="mb-4 px-4">
            <Alert severity="error">{t('loadFailed')}</Alert>
          </div>
        ) : null}
        <section aria-labelledby="voicemail-messages-label">
          <div className="px-4">
            <Text
              id="voicemail-messages-label"
              component="h2"
              className="typography-labelSemiBold text-neutral-b0"
            >
              {t('prerecordedMessages')}
            </Text>
            <Text
              component="p"
              className="typography-descriptor mt-1 text-neutral-b2"
            >
              {t('settingsInfo')}
            </Text>
          </div>
          {allMessages.length === 0 ? (
            <div className="flex min-h-40 items-center justify-center px-4">
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
          <div className="mt-3 px-4">
            <Button
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
          </div>
        </section>
        <section
          className="mt-8 px-4"
          aria-labelledby="voicemail-silence-label"
        >
          {/* The value sits beside the label: a value label on the thumb
              would cover the label above it. */}
          <div className="flex items-center justify-between gap-2">
            <FormLabel id="voicemail-silence-label">
              {t('silenceDuration')}
            </FormLabel>
            <Text
              component="span"
              className="typography-descriptor shrink-0 text-neutral-b1"
            >
              {t('seconds', { count: silenceDuration })}
            </Text>
          </div>
          <Slider
            className="mt-2"
            aria-labelledby="voicemail-silence-label"
            min={2}
            max={8}
            step={1}
            marks
            value={silenceDuration}
            getAriaValueText={(value) => t('seconds', { count: value })}
            onChange={(_, value) => setSilenceDuration(value)}
            onChangeCommitted={(_, value) => onSilenceDurationChange(value)}
          />
          <Text
            component="p"
            className="typography-descriptor mt-2 text-neutral-b2"
          >
            {t('silenceDurationDescription')}
          </Text>
        </section>
      </div>
      <AppFooterNav />
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
    </>
  );
}
