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
import React, { memo, useState, useCallback, useRef } from 'react';

import type {
  WorkingStateSelectProps,
  AgentStateOption,
} from './WorkingStateSelect.interface';

type StatusVariant = ComponentProps<typeof StatusIndicator>['variant'];

const AGENT_STATE_MENU_LIST_CLASS = 'max-h-[280px] overflow-y-auto';

interface AgentStateMenuProps {
  readonly anchorEl: HTMLElement | null;
  readonly open: boolean;
  readonly agentStates: AgentStateOption[];
  readonly currentStateIndex: number;
  readonly onClose: () => void;
  readonly onSelectState: (state: AgentStateOption) => void;
}

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

const AgentStateMenu: FunctionComponent<AgentStateMenuProps> = memo(
  ({
    anchorEl,
    open,
    agentStates,
    currentStateIndex,
    onClose,
    onSelectState,
  }) => {
    return (
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        placement="bottom-start"
        autoFocus={false}
      >
        <MenuList className={AGENT_STATE_MENU_LIST_CLASS} nowrap>
          {agentStates.map((state, index) => {
            const isSelected = currentStateIndex === index;
            const itemStatusVariant = mapColorToStatusVariant(state.color);
            const displayText =
              state.title || state.agentAuxState || state.agentState;
            return (
              <MenuItem
                key={`${state.agentState}-${state.agentAuxState}-${index}`}
                onClick={() => onSelectState(state)}
                selected={isSelected}
                autoFocus={false}
                data-sign="workingStateItem"
              >
                <div className="flex items-center gap-2 w-full min-w-0">
                  <StatusIndicator variant={itemStatusVariant} size="medium" />
                  <MenuItemText primary={displayText} />
                </div>
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    );
  },
);

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
    <div
      className={clsx('flex min-w-0 max-w-full [&>*]:min-w-0', className)}
      data-sign={dataSign}
    >
      <Tooltip title={stateText} triggerWhenDisabled={disabled}>
        <button
          ref={buttonRef}
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className={clsx(
            'flex items-center gap-1.5 min-w-0 overflow-hidden px-1.5 py-1 rounded bg-transparent transition-colors',
            'hover:bg-neutral-b5 focus:outline-none',
            isOverTime ? 'border border-danger' : 'border-0',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'cursor-pointer',
          )}
          data-sign="workingStateButton"
        >
          <StatusIndicator variant={statusVariant} size="medium" />
          <Text className="typography-descriptorMini text-neutral-b1 truncate text-left max-w-24 min-w-0">
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
      <AgentStateMenu
        anchorEl={anchorEl}
        open={isMenuOpen}
        agentStates={agentStates}
        currentStateIndex={currentStateIndex}
        onClose={handleClose}
        onSelectState={handleSelectState}
      />
    </div>
  );
};
