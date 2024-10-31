import React from 'react';
import type { ReactNode } from 'react';
import { styled, palette2 } from '@ringcentral/juno/foundation';
import { RcIconButton, RcTypography } from '@ringcentral/juno';
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

const BackButtonLabel = styled(RcTypography)`
  position: absolute;
  left: 45px;
  top: 8px;
`;

interface BackHeaderProps {
  onBack: () => void;
  children?: ReactNode;
  label?: string;
  hideBackButton?: boolean;
}

export function BackHeader({
  onBack,
  children = null,
  label = undefined,
  hideBackButton = false,
}: BackHeaderProps) {
  return (
    <Header>
      {
        hideBackButton ? null : (
          <BackButton
            symbol={Previous}
            onClick={onBack}
            data-sign="backButton"
          />
        )
      }
      {
        label && (
          <BackButtonLabel variant="body1" color="neutral.f06">
            {label}
          </BackButtonLabel>
        )
      }
      {
        children
      }
    </Header>
  );
}
