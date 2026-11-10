import { Icon } from '@ringcentral/spring-ui';
import { ClockMd } from '@ringcentral/spring-icon';
import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';

import { getClockByTimestamp } from '../../lib/getClockByTimestamp';
import type { WrapUpTimerProps } from './WrapUp.interface';

/**
 * The wrap-up time while the agent is in Pending Disposition.
 */
export const WrapUpTimer: FunctionComponent<WrapUpTimerProps> = ({
  startTime,
  'aria-label': ariaLabel,
}) => {
  const [elapsed, setElapsed] = useState(() => Date.now() - startTime);
  useEffect(() => {
    const update = () => setElapsed(Math.max(0, Date.now() - startTime));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [startTime]);
  const clock = getClockByTimestamp(elapsed);
  return (
    <span
      className="inline-flex flex-none items-center gap-1 rounded-full bg-neutral-b4 px-2 py-1 typography-descriptorMini tabular-nums text-neutral-b1"
      aria-label={ariaLabel}
      data-sign="wrapUpTimer"
    >
      <Icon symbol={ClockMd} size="xsmall" />
      {clock}
    </span>
  );
};
