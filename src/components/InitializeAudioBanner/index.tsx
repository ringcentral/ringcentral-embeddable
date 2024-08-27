import React from 'react';

import {
  RcAlert,
  RcButton,
  styled,
  palette2
} from '@ringcentral/juno';

const StyledAlert = styled(RcAlert)`
  &.RcAlert-root {
    padding: 0 16px;
    background-color: ${palette2('interactive', 'b01')};
  }

  .RcAlert-message {
    font-size: 0.875rem;
    line-height: 40px;
    color: ${palette2('interactive', 'f01')};
  }

  .MuiAlert-action {
    padding-left: 0;
    margin-right: 0;
  }
`;

export function InitializeAudioBanner() {
  return (
    <StyledAlert
      severity="info"
      action={(
        <RcButton
          variant="outlined"
          radius="round"
          size="small"
        >
          Initialize audio
        </RcButton>
      )}
      data-sign="initializeAudioBanner"
    >
      Audio output is disabled.
    </StyledAlert>
  );
}
