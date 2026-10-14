import { CallCtrlButton } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/CallCtrlButton';
import type { FunctionComponent } from 'react';
import React from 'react';

import clsx from 'clsx';

import type { CallControlGridProps } from './CallControlGrid.interface';

// Full class names so Tailwind picks them up
const columnClassNames = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
} as const;

// CallCtrlButton lets its label wrap (`break-words`) and has no prop to
// change that, so the label is reached through its class
const labelLineClassNames = {
  1: '[&_.break-words]:truncate',
  2: '[&_.break-words]:line-clamp-2',
} as const;

/**
 * CallControlGrid - flex-wrap layout rendering call action buttons via CallCtrlButton.
 *
 * The caller builds the action list, making it easy to add, remove, or
 * reorder buttons without touching this component.
 */
export const CallControlGrid: FunctionComponent<CallControlGridProps> = ({
  actions,
  buttonSize,
  columns = 3,
  maxLabelLines,
  className,
  'data-sign': dataSign = 'callControlGrid',
}) => (
  <div
    className={clsx(
      'grid gap-4 justify-items-center',
      columnClassNames[columns],
      maxLabelLines && labelLineClassNames[maxLabelLines],
      className,
    )}
    data-sign={dataSign}
  >
    {actions.map(({ actionType, indicator, tooltip, ...rest }) => (
      <CallCtrlButton
        key={actionType}
        data-sign={actionType}
        value=""
        menuPlacement={undefined}
        TooltipProps={tooltip ? { title: tooltip } : undefined}
        className={indicator ? 'pointer-events-none' : undefined}
        // Only when set: an undefined `size` would still override the
        // button's own default
        {...(buttonSize ? { size: buttonSize } : {})}
        {...rest}
      />
    ))}
  </div>
);
