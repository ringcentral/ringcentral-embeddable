import { CallCtrlButton } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/CallCtrlButton';
import type { FunctionComponent } from 'react';
import React from 'react';

import type { CallControlGridProps } from './CallControlGrid.interface';

/**
 * CallControlGrid - flex-wrap layout rendering call action buttons via CallCtrlButton.
 *
 * The caller builds the action list, making it easy to add, remove, or
 * reorder buttons without touching this component.
 */
export const CallControlGrid: FunctionComponent<CallControlGridProps> = ({
  actions,
  className,
  'data-sign': dataSign = 'callControlGrid',
}) => (
  <div
    className={`grid grid-cols-3 gap-4 justify-items-center${className ? ` ${className}` : ''}`}
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
        {...rest}
      />
    ))}
  </div>
);
