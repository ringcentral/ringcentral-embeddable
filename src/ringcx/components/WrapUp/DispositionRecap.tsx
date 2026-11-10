import { Icon } from '@ringcentral/spring-ui';
import { CheckMd } from '@ringcentral/spring-icon';
import type { FunctionComponent } from 'react';
import React from 'react';

import type { DispositionRecapProps } from './WrapUp.interface';

/**
 * A saved disposition, shown in place of its form on a wrap-up page that is
 * left with the call log to do.
 */
export const DispositionRecap: FunctionComponent<DispositionRecapProps> = ({
  title,
  savedLabel,
  dispositionName,
  notes,
}) => (
  <div
    className="flex flex-col gap-1 rounded-lg border border-neutral-b4 p-3"
    data-sign="dispositionRecap"
  >
    <div className="flex items-center justify-between gap-2 typography-descriptorMini text-neutral-b2">
      <span className="truncate">{title}</span>
      <span className="inline-flex flex-none items-center gap-1 text-success-f">
        <Icon symbol={CheckMd} size="xsmall" />
        {savedLabel}
      </span>
    </div>
    {dispositionName ? (
      <div className="typography-mainText text-neutral-b0 break-words">
        {dispositionName}
      </div>
    ) : null}
    {notes ? (
      <div className="typography-descriptor text-neutral-b1 whitespace-pre-wrap break-words">
        {notes}
      </div>
    ) : null}
  </div>
);
