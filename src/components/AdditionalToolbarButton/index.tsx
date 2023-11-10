import React from 'react';

import { RcTooltip } from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';

const StyledImage = styled.img`
  width: 20px;
  height: 20px;
`;

const Container = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background 150ms cubic-bezier(0.4,0,0.2,1) 0ms;

  :hover {
    background-color: rgba(101,108,128,0.08);
    color: rgba(101,108,128,0.88);
  }
`;

export function AdditionalToolbarButton({
  label,
  icon,
  onClick,
}) {
  return (
    <RcTooltip title={label}>
      <Container>
        <StyledImage
          src={icon}
          onClick={onClick}
          alt={label}
        />
      </Container>
    </RcTooltip>
  );
}
