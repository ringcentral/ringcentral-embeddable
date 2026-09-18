import type { FunctionComponent } from 'react';
import React from 'react';
import clsx from 'clsx';
import { Avatar, ListItem, ListItemText, Tooltip } from '@ringcentral/spring-ui';
import { IncomingCallMd, OutgoingCallMd } from '@ringcentral/spring-icon';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { CallInfoHeaderProps } from './CallInfoHeader.interface';
import i18n from './i18n';

const statusBarColorMap: Record<string, string> = {
  active: 'bg-success',
  callEnd: 'bg-neutral-b4',
};

/**
 * CallInfoHeader - Displays call contact information with status bar
 *
 * Aligned with BasicCallInfo from @ringcentral-integration/widgets.
 * Shows direction icon, subject (contact name), followInfos with "|" separator,
 * and a colored status bar at the bottom.
 */
export const CallInfoHeader: FunctionComponent<CallInfoHeaderProps> = ({
  subject,
  isInbound = false,
  isRinging = false,
  status,
  followInfos,
  className,
  'data-sign': dataSign,
  actions,
  onClick,
}) => {
  const { t } = useLocale(i18n);
  const DirectionIcon = isInbound ? IncomingCallMd : OutgoingCallMd;
  const filteredFollowInfos = followInfos?.filter(Boolean) ?? [];
  const followInfoText = filteredFollowInfos.join(' | ');
  const primaryContent = subject ? (
    <span
      className="typography-subtitle text-neutral-b1 truncate"
      data-sign="matchName"
      title={subject}
    >
      {subject}
    </span>
  ) : null;
  const secondaryContent =
    filteredFollowInfos.length > 0 ? (
      <Tooltip title={followInfoText}>
        <span
          className="typography-descriptor text-neutral-b2 truncate"
          data-sign="followInfo"
        >
          {followInfoText}
        </span>
      </Tooltip>
    ) : null;
  const statusBarColor = status ? statusBarColorMap[status] : undefined;

  return (
    <div
      className={clsx('relative overflow-hidden shadow-[0_2px_5px_0_rgba(0,0,0,0.15)]', className)}
      data-sign={dataSign || 'basicCallInfo'}
    >
      <ListItem
        clickable={!!onClick}
        onClick={onClick}
        divider={false}
        hoverable={false}
        size="large"
      >
        <Avatar
          size="small"
          variant="squircle"
          classes={{ content: 'bg-neutral-base text-neutral-b2' }}
          title={t(isInbound ? 'inbound' : 'outbound')}
        >
          <DirectionIcon />
        </Avatar>
        <ListItemText
          primary={primaryContent}
          secondary={secondaryContent}
        />
        {actions}
      </ListItem>
      {statusBarColor && (
        <div
          className={clsx(
            'absolute bottom-0 left-0 w-full h-[4px]',
            statusBarColor,
            isRinging && 'animate-pulse',
          )}
          data-sign={`shinyBar-${status}`}
        />
      )}
    </div>
  );
};
