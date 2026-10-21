import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { VoicemailMd } from '@ringcentral/spring-icon';
import {
  Alert,
  Button,
  CircularProgressIndicator,
  EmptyState,
  Icon,
  List,
  ListItem,
  ListItemText,
  Text,
} from '@ringcentral/spring-ui';
import React, { useEffect, useRef, useState } from 'react';

import type { VoicemailMessage } from '../../services/VoicemailDrop/VoicemailDrop.interface';
import { SideWidgetPageHeader } from '../SideWidgetView/SideWidgetPageHeader';

import i18n from './i18n';

type PickerError = 'dropFailed' | 'loadFailed';

export function VoicemailDropPanel({
  messages,
  onClose,
  onDrop,
  onLoad,
  showCloseButton,
}: {
  messages: VoicemailMessage[];
  onClose: () => void;
  onDrop: (messageId: string) => Promise<boolean>;
  onLoad: () => Promise<void>;
  showCloseButton: boolean;
}) {
  const { t } = useLocale(i18n);
  const [droppingMessageId, setDroppingMessageId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PickerError | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    let mounted = true;
    mountedRef.current = true;
    void onLoad()
      .catch(() => {
        if (mounted) {
          setError('loadFailed');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
      mountedRef.current = false;
    };
  }, [onLoad]);

  const dropMessage = async (messageId: string): Promise<void> => {
    setError(null);
    setDroppingMessageId(messageId);
    try {
      const dropped = await onDrop(messageId);
      if (!dropped && mountedRef.current) {
        setError('dropFailed');
      }
    } catch {
      if (mountedRef.current) {
        setError('dropFailed');
      }
    } finally {
      if (mountedRef.current) {
        setDroppingMessageId(null);
      }
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-neutral-base">
      {/* Side widget tabs already name the page and close it. */}
      {showCloseButton ? (
        <SideWidgetPageHeader
          title={t('voicemailDrop')}
          onClose={onClose}
          closeLabel={t('close')}
          data-sign="voicemailDropHeader"
          closeDataSign="voicemailDropClose"
        />
      ) : null}
      {/* The list runs edge to edge: its items carry their own inset. */}
      <div className="flex-auto overflow-y-auto py-4">
        <div className="mb-2 px-4">
          <Text
            component="h2"
            className="typography-labelSemiBold text-neutral-b0"
          >
            {t('prerecordedMessages')}
          </Text>
          <Text
            component="p"
            className="typography-descriptor mt-1 text-neutral-b2"
          >
            {t('pickerInfo')}
          </Text>
          {error ? (
            <Alert severity="error" className="mt-3">
              {t(error)}
            </Alert>
          ) : null}
        </div>
        {loading && messages.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center">
            <CircularProgressIndicator size="medium" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center">
            <EmptyState
              icon={VoicemailMd}
              title={t('noMessages')}
              description={t('noMessagesDescription')}
            />
          </div>
        ) : (
          <List aria-label={t('prerecordedMessages')}>
            {messages.map((message) => (
              <ListItem key={message.id} size="small">
                <Icon
                  symbol={VoicemailMd}
                  size="medium"
                  className="text-neutral-b2"
                  aria-hidden
                />
                <ListItemText
                  primary={message.label}
                  classes={{ root: 'min-w-0', primary: 'truncate' }}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  className="shrink-0"
                  disabled={droppingMessageId !== null}
                  data-sign={`voicemailDrop-${message.id}`}
                  aria-label={t('dropMessage', { name: message.label })}
                  onClick={() => void dropMessage(message.id)}
                >
                  {t('drop')}
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </div>
  );
}
