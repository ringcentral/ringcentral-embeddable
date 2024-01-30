import React, { useState, useRef } from 'react';
import { styled } from '@ringcentral/juno/foundation';
import {
  RcIconButton,
  RcMenu,
  RcMenuItem,
  RcListItemText,
  RcListItemIcon,
  RcIcon,
} from '@ringcentral/juno';

import { MoreVert } from '@ringcentral/juno-icon';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledMoreMenu = styled(RcMenu)`
  .RcListItemText-primary {
    font-size: 0.875rem;
  }
`;

export function ActionMenu({
  actions,
  className = undefined,
  maxActions = 3,
  size = undefined,
}) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const currentActions = actions.length > maxActions ? actions.slice(0, maxActions - 1) : actions;
  const moreActions = actions.length > maxActions ? actions.slice(maxActions - 1) : [];
  return (
    <Container className={className}>
      {
        currentActions.map((action, index) => {
          return (
            <RcIconButton
              key={index}
              symbol={action.icon}
              onClick={action.onClick}
              size={size}
              disabled={action.disabled}
              title={action.title}
            />
          );
        })
      }
      {
        moreActions.length > 0 && (
          <RcIconButton
            innerRef={moreButtonRef}
            symbol={MoreVert}
            onClick={() => {
              setMoreMenuOpen(true);
            }}
            size={size}
          />
        )
      }
      {
        moreActions.length > 0 && (
          <StyledMoreMenu
            open={moreMenuOpen}
            onClose={() => {
              setMoreMenuOpen(false);
            }}
            anchorEl={moreButtonRef.current}
          >
            {
              moreActions.map((action, index) => {
                return (
                  <RcMenuItem
                    key={index}
                    onClick={() => {
                      action.onClick();
                      setMoreMenuOpen(false);
                    }}
                    disabled={action.disabled}
                  >
                    <RcListItemIcon>
                      <RcIcon symbol={action.icon} size="small" />
                    </RcListItemIcon>
                    <RcListItemText primary={action.title} />
                  </RcMenuItem>
                );
              })
            }
          </StyledMoreMenu>
        )
      }
    </Container>
  );
}
