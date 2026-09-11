import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  PlayOutlinedMd,
  SendFilledMd,
  VoicemailMd,
  Xmd,
} from '@ringcentral/spring-icon';
import {
  Alert,
  CircularProgressIndicator,
  EmptyState,
  Icon,
  IconButton,
  List,
  ListItem,
  ListItemText,
  PageHeader,
  PageHeaderCenter,
  PageHeaderLeft,
  PageHeaderRight,
  PageHeaderTitle,
  Text,
} from '@ringcentral/spring-ui';
import React, { useEffect, useRef, useState } from 'react';

import type { VoicemailMessage } from '../../services/VoicemailDrop/VoicemailDrop.interface';

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
      <PageHeader
        variant="detached"
        className="flex-none border-b border-neutral-b4"
        data-sign="voicemailDropHeader"
      >
        <PageHeaderLeft />
        <PageHeaderCenter data-sign="voicemailDropHeaderCenter">
          <PageHeaderTitle>{t('voicemailDrop')}</PageHeaderTitle>
        </PageHeaderCenter>
        <PageHeaderRight>
          {showCloseButton ? (
            <IconButton
              variant="icon"
              color="secondary"
              size="medium"
              symbol={Xmd}
              data-sign="voicemailDropClose"
              TooltipProps={{ title: t('close') }}
              onClick={onClose}
            />
          ) : null}
        </PageHeaderRight>
      </PageHeader>
      <div className="flex-auto overflow-y-auto p-4">
        <Alert>{t('pickerInfo')}</Alert>
        {error ? (
          <Alert severity="error" className="mt-3">
            {t(error)}
          </Alert>
        ) : null}
        <Text
          component="h2"
          className="typography-labelSemiBold mb-2 mt-4 text-neutral-b0"
        >
          {t('prerecordedMessages')}
        </Text>
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
                <Icon symbol={PlayOutlinedMd} size="medium" />
                <ListItemText
                  primary={message.label}
                  classes={{ root: 'min-w-0', primary: 'truncate' }}
                />
                <IconButton
                  variant="icon"
                  color="primary"
                  size="medium"
                  symbol={SendFilledMd}
                  disabled={droppingMessageId !== null}
                  data-sign={`voicemailDrop-${message.id}`}
                  TooltipProps={{
                    title: t('dropMessage', { name: message.label }),
                  }}
                  onClick={() => void dropMessage(message.id)}
                />
              </ListItem>
            ))}
          </List>
        )}
      </div>
    </div>
  );
}
