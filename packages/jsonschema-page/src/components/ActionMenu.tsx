import React, { useState, useRef } from 'react';
import {
  RcIconButton,
  RcMenu,
  RcMenuItem,
  RcListItemText,
  RcListItemIcon,
  RcIcon,
  styled,
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
  iconVariant = undefined,
  color = undefined,
  onClick = undefined,
  onMoreMenuOpen = undefined,
}) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const currentActions = actions.length > maxActions ? actions.slice(0, maxActions - 1) : actions;
  const moreActions = actions.length > maxActions ? actions.slice(maxActions - 1) : [];

  return (
    <Container className={className} onClick={onClick}>
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
              variant={iconVariant}
              color={action.color || color}
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
              onMoreMenuOpen?.(true);
            }}
            size={size}
            variant={iconVariant}
            color={color}
          />
        )
      }
      {
        moreActions.length > 0 && (
          <StyledMoreMenu
            open={moreMenuOpen}
            onClose={() => {
              setMoreMenuOpen(false);
              onMoreMenuOpen?.(false);
            }}
            anchorEl={moreButtonRef.current}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {
              moreActions.map((action, index) => {
                return (
                  <RcMenuItem
                    key={index}
                    onClick={() => {
                      action.onClick();
                      setMoreMenuOpen(false);
                      onMoreMenuOpen?.(false);
                    }}
                    disabled={action.disabled}
                  >
                    <RcListItemIcon color={action.color}>
                      <RcIcon symbol={action.icon} size="small" />
                    </RcListItemIcon>
                    <RcListItemText primary={action.title} color={action.color} />
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
