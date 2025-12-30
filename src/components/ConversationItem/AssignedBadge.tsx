import React from 'react';
import { RcChip, RcTooltip, RcIcon, styled, palette2 } from '@ringcentral/juno';
import { Check, CallsBorder } from '@ringcentral/juno-icon';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join('');
}

const StyledChip = styled(RcChip)`
  height: 20px;
  line-height: 20px;
  padding: 0;
  font-size: 0.75rem;

  .MuiChip-label {
    padding: 0 8px;
  }
`;

const HighlightedChip = styled(StyledChip)`
  background-color: ${palette2('highlight', 'b03')};
  color: ${palette2('neutral', 'f01')};
  border: none;

  &:hover {
    background-color: ${palette2('highlight', 'b03')};
    color: ${palette2('neutral', 'f01')};
    border: none;
  }
`;

const UnassignedChip = styled(StyledChip)`
  background-color: ${palette2('neutral', 'f02')};
  color: ${palette2('neutral', 'f01')};
  border: none;

  &:hover {
    background-color: ${palette2('neutral', 'f02')};
    color: ${palette2('neutral', 'f01')};
    border: none;
  }
`;

const ResolvedChip = styled(StyledChip)`
  background-color: ${palette2('avatar', 'global')};
  color: ${palette2('neutral', 'f01')};
  border: none;

  &:hover {
    background-color: ${palette2('avatar', 'global')};
    color: ${palette2('neutral', 'f01')};
    border: none;
  }

  .MuiChip-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
`;

export function AssignedFullBadge({
  assignee,
  className,
  isAssignedToMe,
  status,
  statusReason,
}: {
  assignee: {
    name: string;
  };
  className?: string;
  isAssignedToMe: boolean;
  status: string;
  statusReason: string;
}) {
  if (status === 'Resolved') {
    const tooltipTitle = statusReason === 'ThreadExpired' ? 'Conversation resolved automatically.' : 'Resolved';
    return (
      <RcTooltip title={tooltipTitle}>
        <ResolvedChip label={
          <>
            {
              statusReason === 'ThreadExpired' && (
                <>
                  <RcIcon symbol={CallsBorder} size="xsmall" />
                  &nbsp;
                </>
              )
            }
            RESOLVED
          </>
        } className={className} />
      </RcTooltip>
    );
  }
  if (!assignee) {
    return (
      <RcTooltip title="Unassigned">
        <UnassignedChip
          label="UNASSIGNED"
          className={className}
        />
      </RcTooltip>
    );
  }
  if (!isAssignedToMe) {
    return (
      <RcTooltip title={`Conversation is assigned to ${assignee.name}`}>
        <StyledChip
          label={`ASSIGNED TO ${(assignee.name || '').toUpperCase()}`}
          variant="outlined"
          color="action.primary"
          className={className}
        />
      </RcTooltip>
    );
  }
  return (
    <RcTooltip title="Conversation is assigned to you">
      <HighlightedChip
        label="ASSIGNED TO YOU"
        className={className}
      />
    </RcTooltip>
  );
}

export function AssignedShortBadge({
  assignee,
  isAssignedToMe,
  className,
}: {
  assignee: {
    name: string;
  };
  isAssignedToMe: boolean;
  className?: string;
}) {
  if (!assignee) {
    return null;
  }
  const initials = getInitials(assignee.name);
  if (!isAssignedToMe) {
    return (
      <RcTooltip title={`Conversation is assigned to ${assignee.name}`}>
        <StyledChip
          label={initials}
          variant="outlined"
          color="action.primary"
          className={className}
        />
      </RcTooltip>
    );
  }
  return (
    <RcTooltip title="Conversation is assigned to you">
      <HighlightedChip
        label={initials}
        className={className}
      />
    </RcTooltip>
  );
}

export function ResolvedShortBadge({
  reason,
  className,
}: {
  reason: string;
  className?: string;
}) {
  return (
    <RcTooltip title="Resolved">
      <ResolvedChip
        className={className}
        label={
          <>
            {
              reason === 'ThreadExpired' && <RcIcon symbol={CallsBorder} size="xsmall" />
            }
            <RcIcon symbol={Check} size="small" />
          </>
        }
      />
    </RcTooltip>
  );
}
