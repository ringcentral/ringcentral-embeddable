import React from 'react';
import {
  styled,
  RcTypography,
  RcIcon,
} from '@ringcentral/juno';
import { ReportIssue, InfoBorder } from '@ringcentral/juno-icon';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export function CustomizedAlert({
  message,
  showMore = false,
}) {
  const { payload, level } = message;
  return (
    <Container>
      <RcTypography>
        <RcIcon
          symbol={level === 'danger' ? ReportIssue : InfoBorder}
        />
        {payload && payload.alertMessage}
      </RcTypography>
    </Container>
  )
}