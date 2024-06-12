
import React from 'react';
import {
  styled,
  RcIconButton,
  RcTypography,
} from '@ringcentral/juno';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 74px;
`;

const Title = styled(RcTypography)`
  margin-top: 8px;
`;

export function CallButton({
  title,
  symbol,
  onClick,
  disabled,
  dataSign
}) {
  return (
    <Container data-sign={dataSign}>
      <RcIconButton
        symbol={symbol}
        onClick={onClick}
        disabled={disabled}
        variant="inverse"
        color="neutral.f06"
        size="large"
      />
      <Title variant="caption1" color="neutral.f06">
        {title}
      </Title>
    </Container>
  );
}
