import React from 'react';
import { Button } from '@ringcentral/spring-ui';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { FunctionComponent } from 'react';

import type { ProgressiveDialPhase } from '../../services/CxProgressiveDial';
import { useSecondsUntil } from '../../hooks/useSecondsUntil';
import i18n from './i18n';

export interface ProgressiveDialFooterProps {
  /** Whether the progressive dialer is running */
  running: boolean;
  /** Current dialer step */
  phase: ProgressiveDialPhase;
  /** Epoch milliseconds of the next dial or lead fetch */
  nextDialAt: number | null;
  /** Whether Start dialing is disabled, for example while on a call */
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

/**
 * Footer of the Leads tab in progressive dial mode: the Start dialing /
 * Stop dialing toggle and the countdown to the next dial.
 */
export const ProgressiveDialFooter: FunctionComponent<
  ProgressiveDialFooterProps
> = ({ running, phase, nextDialAt, disabled = false, onStart, onStop }) => {
  const { t } = useLocale(i18n);
  const seconds = useSecondsUntil(nextDialAt);
  const countdownText =
    seconds === null
      ? ''
      : t(phase === 'noLeads' ? 'retryIn' : 'timeToDial', { seconds });
  return (
    <div
      className="flex flex-col items-center gap-2 p-4 border-t border-neutral-b4"
      data-sign="progressiveDialFooter"
    >
      {countdownText ? (
        <span
          className="typography-descriptor text-neutral-b2 truncate max-w-full"
          aria-live="polite"
          data-sign="progressiveDialCountdown"
        >
          {countdownText}
        </span>
      ) : null}
      {running ? (
        <Button
          variant="outlined"
          color="danger"
          onClick={onStop}
          data-sign="stopDialingButton"
        >
          {t('stopDialing')}
        </Button>
      ) : (
        <Button
          variant="outlined"
          color="primary"
          loading={phase === 'connecting'}
          disabled={disabled}
          onClick={onStart}
          data-sign="startDialingButton"
        >
          {t('startDialing')}
        </Button>
      )}
    </div>
  );
};
