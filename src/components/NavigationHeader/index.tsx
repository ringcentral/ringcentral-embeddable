import React from 'react';

import { styled, palette2, css } from '@ringcentral/juno/foundation';
import { RcIconButton, RcTypography } from '@ringcentral/juno';

interface HeaderProps {
  $bottomLine?: boolean;
}

const StyledHeader = styled.div<HeaderProps>`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0 16px;
  background-color: ${palette2('neutral', 'b01')};
  height: 40px;
  ${(props) => props.$bottomLine && css`
    border-bottom: 1px solid ${palette2('header', 'divider')};
  `}
`;

const StyledTitle = styled(RcTypography)`
  flex: 1;
  font-size: 1.13rem;
`;

export function NavigationHeader({
  title,
  showHeaderBorder = false,
  actionsInHeaderRight = [],
}) {
  return (
    <StyledHeader $bottomLine={showHeaderBorder}>
      <StyledTitle variant="title2" color="neutral.f06" title={title}>
        {title}
      </StyledTitle>
      {
        actionsInHeaderRight.map((action, index) => {
          return (
            <RcIconButton
              key={index}
              title={action.title}
              symbol={action.icon}
              onClick={action.onClick}
              useRcTooltip
            />
          );
        })
      }
    </StyledHeader>
  );
}
