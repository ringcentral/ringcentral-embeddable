import type {
  ComponentType,
  DOMAttributes,
  FunctionComponent,
  ReactElement,
} from 'react';
import React from 'react';

import { styled, focusVisible, palette2 } from '@ringcentral/juno/foundation';
import {
  RcListItem,
  RcIcon,
  RcListItemIcon,
  RcListItemText,
  RcBadge,
} from '@ringcentral/juno';

type NavigationButtonIconProps = {
  currentPath?: string;
};

export type NavigationButtonIcon =
  | ReactElement
  | ComponentType<NavigationButtonIconProps>;

export interface NavigationButtonProps {
  icon: NavigationButtonIcon;
  activeIcon: NavigationButtonIcon;
  active?: boolean;
  label: string;
  noticeCounts?: number;
  width: number | string;
  height: number | string;
  onClick: DOMAttributes<HTMLDivElement>['onClick'];
  keepStyle: boolean;
  activeClassName: string;
  inActiveClassName: string;
  className?: string;
  id?: string;
  tooltipForceHide?: boolean;
  dataSign?: string;
  innerRef?: React.RefObject<HTMLDivElement>;
}

const StyledRcListItem = styled(RcListItem)`
  min-width: 58px;
  min-height: 59px;
  height: 59px;
  width: auto;
  padding: 10px 3px;
  border-radius: 4px;
  box-sizing: border-box;
  cursor: pointer !important;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;

  :hover,
  ${focusVisible} {
    background-color: ${palette2('nav', 'menuBg', 0.08)};
  }

  ${focusVisible} {
    box-shadow: inset 0px 0px 0px 1px ${palette2('action', 'primary')};
  }
`;

const StyledBadge = styled(RcBadge)`
  justify-content: center;
  top: 3px;
`;

const StyledIcon = styled(RcListItemIcon)`
  ${RcIcon} {
    margin: 0;
    font-size: 24px;
  }
`;

const StyledListItemText = styled(RcListItemText)`
  margin: 0px;
  flex: 1 1 auto;
  width: 100%;

  .RcListItemText-primary {
    font-weight: 400;
    font-size: 0.75rem;
    word-break: break-word;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &::after {
    display: block;
    content: attr(data-title);
    font-weight: 700;
    visibility: hidden;
    height: 1px;
    color: transparent;
    margin-bottom: -1px;
    overflow: hidden;
  }
`;


  export const NavigationButton: FunctionComponent<NavigationButtonProps> = ({
    active,
    activeIcon,
    icon,
    label,
    noticeCounts,
    onClick,
    id,
    dataSign,
    innerRef,
  }) => {
    const color = active ? 'nav.iconSelected' : 'nav.iconDefault';
    let currentIcon = active ? activeIcon : icon;

    return (
      <StyledRcListItem
        role="tab"
        size="medium"
        disableGutters
        disableTouchRipple
        onClick={onClick}
        useRcTooltip
        title={label}
        selected={active}
        aria-label={label}
        aria-selected={active}
        color={color}
        innerRef={innerRef}
        id={id}
        data-sign={dataSign ?? label}
      >
        {
          noticeCounts && noticeCounts > 0 ? (
            <StyledBadge
              badgeContent={noticeCounts}
              max={99}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
            >
              <StyledIcon>
                {currentIcon}
              </StyledIcon>
            </StyledBadge>
          ) : (
            <StyledIcon>
              {currentIcon}
            </StyledIcon>
          )
        }
        <StyledListItemText
          primary={label}
          primaryTypographyProps={{
            variant: 'body1',
            color,
            align: 'center',
          }}
        />
      </StyledRcListItem>
    );
  };
  
  NavigationButton.defaultProps = {
    active: false,
    keepStyle: false,
  };
  
  export default NavigationButton;
  