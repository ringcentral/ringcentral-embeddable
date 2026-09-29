import type React from 'react';

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
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
