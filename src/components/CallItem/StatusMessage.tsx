import React from 'react';

import { RcText, styled } from '@ringcentral/juno';

const StyledText = styled(RcText)`
  margin-left: 8px;
`;

export function StatusMessage({ statusMatch }) {
  if (!statusMatch) {
    return null;
  }
  const { message, status } = statusMatch;
  if (!message) {
    return null;
  }
  let color: string | undefined = undefined;
  if (status === 'pending') {
    color = 'warning.f02';
  } else if (status === 'failed') {
    color = 'danger.f02';
  } else if (status === 'success') {
    color = 'success.f02';
  }
  return (
    <StyledText
      color={color}
      title={message}
      variant="caption1"
      component="span"
    >
      {message}
    </StyledText>
  );
}
