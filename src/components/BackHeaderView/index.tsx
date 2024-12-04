import React from 'react';
import type { ReactNode } from 'react';
import { styled, RcTypography } from '@ringcentral/juno';

import { BackHeader } from '../BackHeader';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Title = styled(RcTypography)`
  text-align: center;
  display: block;
  padding: 0 10px;
  line-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export function BackHeaderView({
  onBack,
  children = null,
  backButtonLabel = undefined,
  title = undefined,
  rightButton = undefined,
  className = undefined,
  dataSign = undefined,
  hideHeader = false,
  hideBackButton = false,
}: {
  onBack?: () => void;
  children?: ReactNode;
  backButtonLabel?: string;
  title?: string;
  rightButton?: ReactNode;
  className?: string;
  dataSign?: string;
  hideHeader?: boolean;
  hideBackButton?: boolean;
}) {
  return (
    <Container className={className} data-sign={dataSign}>
      {
        hideHeader ? null : (
          <BackHeader onBack={onBack} label={backButtonLabel} hideBackButton={hideBackButton}>
            {
              title && (
                <Title variant="body1" color="neutral.f06" data-sign="headerTitle" title={title}>
                  {title}
                </Title>
              )
            }
            {rightButton}
          </BackHeader>
        )
      }
      <Content>
        {children}
      </Content>
    </Container>
  );
}