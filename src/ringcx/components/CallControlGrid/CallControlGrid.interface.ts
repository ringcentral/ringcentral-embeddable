import type React from 'react';
import type { IconButtonSize } from '@ringcentral/spring-ui';

/**
 * Supported call control action types.
 * New actions can be added by extending this union.
 */
export type CallControlActionType =
  | 'transfer'
  | 'disposition'
  | 'hold'
  | 'mute'
  | 'record'
  | 'keypad';

/**
 * Descriptor for a single call control action button.
 * The view module builds this list; the grid just renders it.
 */
export interface CallControlAction {
  /** Identifies the action (used as key and data-sign) */
  actionType: CallControlActionType | string;
  /** Icon symbol component from @ringcentral/spring-icon */
  symbol: React.ComponentType;
  /** Text label displayed below the icon */
  label: string;
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /** Whether this button is disabled */
  disabled?: boolean;
  /** Icon button color */
  color?: 'neutral' | 'danger' | 'warning';
  /** Optional tooltip text */
  tooltip?: string;
  /**
   * When true, render as a non-interactive indicator (pointer-events-none).
   * Used for auto-record indicators.
   */
  indicator?: boolean;
}

/**
 * Props for CallControlGrid container
 */
export interface CallControlGridProps {
  /** Ordered list of action buttons to render in the grid */
  actions: CallControlAction[];
  /** Icon button size, CallCtrlButton's own `xxlarge` by default */
  buttonSize?: IconButtonSize;
  /** Number of grid columns, 3 by default */
  columns?: 2 | 3;
  /**
   * Cap each label at this many lines, cutting the rest off with an ellipsis,
   * so a long or translated label cannot make its row grow without limit.
   * Labels wrap freely when unset.
   */
  maxLabelLines?: 1 | 2;
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
