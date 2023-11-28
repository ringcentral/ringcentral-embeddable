import React from 'react';

import {
  RcAlert,
  RcIcon,
  RcLink,
} from '@ringcentral/juno';
import { InfoBorder } from '@ringcentral/juno-icon';
import { styled } from '@ringcentral/juno/foundation';

const DemoOnlyWarning = styled(RcAlert)`
  padding: 2px 16px 2px 42px!important;

  .RcAlert-message {
    font-size: 14px !important;
    line-height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    a {
      line-height: 16px;
      height: 16px;
      color: inherit;
    }

    .MuiAlert-action {
      padding-left: 0;
    }
  }
`;

export function DemoOnlyBanner({
  show,
  onClose,
}) {
  if (!show) {
    return null;
  }
  return (
    <DemoOnlyWarning
      severity="error"
      onClose={onClose}
    >
      FOR DEMO PURPOSES ONLY &nbsp;
      <RcLink
        href="https://ringcentral.github.io/ringcentral-embeddable/docs/app-registration/"
        target='_blank'
      >
        <RcIcon
          symbol={InfoBorder}
          size="small"
        />
      </RcLink>
    </DemoOnlyWarning>
  );
}
