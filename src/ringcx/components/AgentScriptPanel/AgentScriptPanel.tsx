import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import React from 'react';

import { AgentScriptFrame } from './AgentScriptFrame';
import type { AgentScriptPanelProps } from './AgentScriptPanel.interface';
import i18n from './i18n';

/**
 * Agent Script side widget body. The side widget tab already names the panel,
 * so it has no title of its own.
 */
export function AgentScriptPanel(props: AgentScriptPanelProps) {
  const { callId, script, loading, error } = props;
  const { t } = useLocale(i18n);

  return (
    <section
      aria-label={t('agentScript')}
      data-sign="agentScriptPanel"
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-neutral-base"
    >
      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {loading ? (
          <div
            className="flex h-full w-full items-center justify-center text-neutral-b2"
            data-sign="agentScriptLoading"
          >
            <span className="typography-mainText">
              {t('loadingAgentScript')}
            </span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex h-full w-full items-center justify-center p-6 text-center text-danger"
            data-sign="agentScriptError"
          >
            <span className="typography-mainText">{error}</span>
          </div>
        ) : script ? (
          <AgentScriptFrame key={callId} {...props} />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-neutral-b2"
            data-sign="agentScriptEmpty"
          >
            <span className="typography-mainText">{t('noAgentScript')}</span>
          </div>
        )}
      </div>
    </section>
  );
}
