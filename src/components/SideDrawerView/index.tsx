import React from 'react';
import { RcDrawer, styled } from '@ringcentral/juno';

const StyledDrawer = styled(RcDrawer)`
  &.MuiDrawer-docked {
    height: 100%;
    width: 50%;
    .RcDrawer-paper {
      width: 50%;
    }
  }
`;

export function SideDrawerView({
  show,
  children,
  variant = 'permanent',
}) {

  if (!show && variant === 'permanent') {
    return null;
  }

  return (
    <StyledDrawer
      anchor="right"
      variant={variant as "permanent" | "temporary"}
      open={show}
      keepMounted
    >
      {children}
    </StyledDrawer>
  );
}
