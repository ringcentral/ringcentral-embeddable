import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import React, { useEffect, useState } from 'react';

import type { CxAgentAssistantFrameParams } from '../../services/CxAgentAssistant';
import { AgentAssistantFrame } from './AgentAssistantFrame';
import type { AgentAssistantPanelProps } from './AgentAssistantPanel.interface';
import i18n from './i18n';

type FrameState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; params: CxAgentAssistantFrameParams };

/**
 * Agent Assistant side widget body. The side widget tab already names the
 * panel, so it has no title of its own.
 */
export function AgentAssistantPanel({
  callId,
  getParams,
}: AgentAssistantPanelProps) {
  const { t } = useLocale(i18n);
  // The auth code in the params is single use, so they are resolved once per
  // mount and the frame is remounted (by call id) rather than re-configured.
  const [frameState, setFrameState] = useState<FrameState>({
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    setFrameState({ status: 'loading' });
    getParams(callId)
      .then((params) => {
        if (cancelled) return;
        setFrameState(
          params ? { status: 'ready', params } : { status: 'unavailable' },
        );
      })
      .catch(() => {
        if (cancelled) return;
        setFrameState({ status: 'unavailable' });
      });
    return () => {
      cancelled = true;
    };
  }, [callId, getParams]);

  return (
    <section
      aria-label={t('agentAssistant')}
      data-sign="agentAssistantPanel"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-base"
    >
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {frameState.status === 'loading' ? (
          <div
            className="flex h-full w-full items-center justify-center text-neutral-b2"
            data-sign="agentAssistantLoading"
          >
            <span className="typography-mainText">
              {t('loadingAgentAssistant')}
            </span>
          </div>
        ) : frameState.status === 'ready' ? (
          <AgentAssistantFrame params={frameState.params} />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-6 text-center text-neutral-b2"
            data-sign="agentAssistantUnavailable"
          >
            <span className="typography-mainText">
              {t('agentAssistantUnavailable')}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
