import {
  Menu,
  MenuItem,
  MenuList,
  MenuItemText,
  Icon,
  StatusIndicator,
  Tooltip,
  Text,
} from '@ringcentral/spring-ui';
import type { ComponentProps } from 'react';
import { CaretDownMd, CaretUpMd } from '@ringcentral/spring-icon';
import clsx from 'clsx';
import type { FunctionComponent, MouseEvent } from 'react';
import React, { useState, useCallback, useRef } from 'react';

import type {
  WorkingStateSelectProps,
  AgentStateOption,
} from './WorkingStateSelect.interface';

type StatusVariant = ComponentProps<typeof StatusIndicator>['variant'];

/**
 * Map agent state color string to StatusIndicator variant
 */
const mapColorToStatusVariant = (color?: string): StatusVariant => {
  switch (color) {
    case 'green':
      return 'available';
    case 'red':
      return 'dnd';
    case 'orange':
    case 'yellow':
      return 'busy';
    case 'grey':
    case 'gray':
    case 'blue':
    default:
      return 'unavailable';
  }
};

/**
 * WorkingStateSelect - Agent state dropdown with timer
 *
 * Displays the current agent working state with a colored indicator,
 * timer, and dropdown menu to change states.
 */
export const WorkingStateSelect: FunctionComponent<WorkingStateSelectProps> = ({
  agentStates,
  currentStateIndex,
  stateText,
  stateColor,
  timerText,
  onChangeState,
  isOverTime = false,
  disabled = false,
  className,
  'data-sign': dataSign,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (!disabled) {
        setAnchorEl(event.currentTarget);
      }
    },
    [disabled],
  );

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleSelectState = useCallback(
    (state: AgentStateOption) => {
      handleClose();
      onChangeState(state);
    },
    [handleClose, onChangeState],
  );

  const statusVariant = mapColorToStatusVariant(stateColor);

  return (
    <div className={clsx('flex min-w-0 [&>*]:min-w-0', className)} data-sign={dataSign}>
      <Tooltip title={stateText} triggerWhenDisabled={disabled}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={clsx(
            'flex items-center gap-1.5 w-full px-1.5 py-1 rounded border transition-colors',
            'hover:bg-neutral-b5 focus:outline-none',
            isOverTime
              ? 'border-danger'
              : 'border-transparent',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer',
          )}
          data-sign="workingStateButton"
        >
          <StatusIndicator variant={statusVariant} size="medium" />
          <Text className="typography-descriptorMini text-neutral-b1 truncate text-left flex-1 min-w-0">
            {stateText}
          </Text>
          <span
            className={clsx(
              'typography-descriptorMini flex-shrink-0',
              isOverTime ? 'text-danger' : 'text-neutral-b2',
            )}
            data-sign="timer"
          >
            {timerText}
          </span>
          <Icon
            symbol={isMenuOpen ? CaretUpMd : CaretDownMd}
            size="xsmall"
            className="text-neutral-b2 flex-shrink-0"
          />
        </button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleClose}
        placement="bottom-start"
      >
        <MenuList>
          {agentStates.map((state, index) => {
            const isSelected = currentStateIndex === index;
            const itemStatusVariant = mapColorToStatusVariant(state.color);
            const displayText =
              state.title || state.agentAuxState || state.agentState;

            return (
              <MenuItem
                key={`${state.agentState}-${state.agentAuxState}-${index}`}
                onClick={() => handleSelectState(state)}
                selected={isSelected}
                data-sign="workingStateItem"
              >
                <div className="flex items-center gap-2 w-full">
                  <StatusIndicator variant={itemStatusVariant} size="medium" />
                  <MenuItemText primary={displayText} />
                </div>
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    </div>
  );
};
