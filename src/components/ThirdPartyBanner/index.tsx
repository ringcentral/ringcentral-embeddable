import React from 'react';
import {
  RcAlert,
  RcButton,
  styled,
  css,
  palette2,
} from '@ringcentral/juno';
import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-page';

type AlertSeverity = 'info' | 'warning' | 'error' | 'success';
export interface ThirdPartyBannerProps {
  id: string;
  message: string;
  severity?: AlertSeverity | 'announcement';
  action?: {
    label: string;
    variant?: 'text' | 'outlined' | 'contained' | 'plain';
    color?: string;
  };
  closable?: boolean;
  closeButtonLabel?: string;
}

const StyledAlert = styled(RcAlert)<{ $isAnnouncement: boolean }>`
  &.RcAlert-root {
    padding: 0 16px;
  }

  .RcAlert-message {
    font-size: 0.875rem;
    line-height: 40px;

    a {
      font-size: 0.875rem;
      line-height: 40px;
    }
  }

  .MuiAlert-action {
    padding-left: 0;
    margin-right: 0;
  }

  ${({ $isAnnouncement }) => $isAnnouncement && css`

    &.RcAlert-root {
      background-color: ${palette2('highlight', 'b03')};
      color: ${palette2('neutral', 'f01')};
    }

    .RcAlert-message {
      color: ${palette2('neutral', 'f01')};

      a {
        color: ${palette2('neutral', 'f01')};
      }
    }
  `}
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

  let alertSeverity = severity;
  if (severity === 'announcement') {
    alertSeverity = 'info';
  }
  if (['info', 'warning', 'error', 'success'].indexOf(alertSeverity) === -1) {
    alertSeverity = 'info';
  }
  return (
    <StyledAlert
      severity={alertSeverity as AlertSeverity}
      $isAnnouncement={severity === 'announcement'}
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
      closeText={banner.closeButtonLabel || 'Close'}
      data-sign={`thirdPartyBanner-${id}`}
    >
      <TextWithMarkdown text={message} />
    </StyledAlert>
  );
}
