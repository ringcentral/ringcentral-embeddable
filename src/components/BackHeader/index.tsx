import React from 'react';
import { styled, palette2 } from '@ringcentral/juno/foundation';
import { RcIconButton } from '@ringcentral/juno';
import { Previous } from '@ringcentral/juno-icon';

const BackButton = styled(RcIconButton)`
  position: absolute;
  left: 6px;
  top: 0;
`;

const Header = styled.div`
  position: relative;
  display: block;
  padding: 0 34px;
  height: 40px;
  min-height: 32px;
  text-align: center;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  background-color: ${palette2('nav', 'b01')};
`;

export function BackHeader({
  onBack,
  children,
}) {
  return (
    <Header>
      <BackButton
        symbol={Previous}
        onClick={onBack}
        data-sign="backButton"
      />
      {
        children
      }
    </Header>
  );
}
