import { CollapseLeftMd, CollapseRightMd } from '@ringcentral/spring-icon';
import { IconButton } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

export interface SideWidgetToggleButtonProps {
  visible: boolean;
  onToggle: () => void;
  label: string;
}

/**
 * Header action that shows or hides the RingCX side widgets.
 *
 * Rendered on the routes an agent works a call from, so a widget closed on one
 * of them can be brought back from any of the others: the widgets only open on
 * their own when their availability changes, never because the agent moved
 * between screens.
 */
export const SideWidgetToggleButton: FunctionComponent<
  SideWidgetToggleButtonProps
> = ({ visible, onToggle, label }) => (
  <IconButton
    // The arrow points where the click sends the widget: out to the right when
    // it is on screen, back in from the right when it is not.
    symbol={visible ? CollapseLeftMd : CollapseRightMd}
    onClick={onToggle}
    size="medium"
    variant="contained"
    color="secondary"
    data-sign="toggleSideWidgetButton"
    TooltipProps={{ title: label }}
  />
);
