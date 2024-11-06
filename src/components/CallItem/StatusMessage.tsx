import React from 'react';

import { RcText, styled } from '@ringcentral/juno';

export function StatusMessage({ statusMatch, className }: {
  statusMatch?: { message: string; status: string };
  className?: string;
}) {
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
    <RcText
      color={color}
      title={message}
      variant="caption1"
      component="span"
      className={className}
    >
      {message}
    </RcText>
  );
}
