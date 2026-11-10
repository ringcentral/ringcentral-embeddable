import { CircularProgressIndicator, Icon } from '@ringcentral/spring-ui';
import { CheckMd, ClockMd } from '@ringcentral/spring-icon';
import type { FunctionComponent } from 'react';
import React from 'react';

import type { WrapUpPillLabelProps } from './WrapUp.interface';

/**
 * A wrap-up pill tab label with its mark: a red dot for a part that needs
 * input or failed, a spinner while it saves, a check once it is saved, and a
 * clock for a call log saved when the call ends.
 */
export const WrapUpPillLabel: FunctionComponent<WrapUpPillLabelProps> = ({
  text,
  mark,
  needsInputLabel,
  savedLabel,
  queuedLabel,
}) => (
  <span className="inline-flex items-center gap-1">
    {text}
    {mark === 'error' ? (
      <span
        className="size-2 flex-none rounded-full bg-danger"
        role="img"
        aria-label={needsInputLabel}
        data-sign="wrapUpPillError"
      />
    ) : null}
    {mark === 'done' ? (
      <span
        className="inline-flex text-success-f"
        role="img"
        aria-label={savedLabel}
        data-sign="wrapUpPillDone"
      >
        <Icon symbol={CheckMd} size="xsmall" />
      </span>
    ) : null}
    {mark === 'saving' ? <CircularProgressIndicator size="xsmall" /> : null}
    {mark === 'queued' ? (
      <span
        className="inline-flex text-neutral-b2"
        role="img"
        aria-label={queuedLabel}
        data-sign="wrapUpPillQueued"
      >
        <Icon symbol={ClockMd} size="xsmall" />
      </span>
    ) : null}
  </span>
);
