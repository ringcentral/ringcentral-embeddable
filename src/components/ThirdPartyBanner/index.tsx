import React from 'react';
import {
  RcAlert,
  RcButton,
  styled,
} from '@ringcentral/juno';
import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-page';

export interface ThirdPartyBannerProps {
  id: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  action?: {
    label: string;
    variant?: 'text' | 'outlined' | 'contained' | 'plain';
    color?: string;
  };
  closable?: boolean;
}

const StyledAlert = styled(RcAlert)`
  &.RcAlert-root {
    padding: 0 16px;
  }

  .RcAlert-message {
    font-size: 0.875rem;
    line-height: 40px;
  }

  .MuiAlert-action {
    padding-left: 0;
    margin-right: 0;
  }
`;

export function ThirdPartyBanner({
  banner,
  onAction,
  onClose,
}: {
  banner: ThirdPartyBannerProps;
  onAction: () => void;
  onClose: () => void;
}) {
  if (!banner) {
    return null;
  }

  const { id, message, severity = 'info', action, closable = false } = banner;

  return (
    <StyledAlert
      severity={severity}
      onClose={closable ? onClose : undefined}
      action={
        action ? (
          <RcButton
            variant={action.variant || 'outlined'}
            color={action.color as any}
            radius="round"
            size="small"
            onClick={onAction}
          >
            {action.label}
          </RcButton>
        ) : undefined
      }
      data-sign={`thirdPartyBanner-${id}`}
    >
      <TextWithMarkdown text={message} />
    </StyledAlert>
  );
}

