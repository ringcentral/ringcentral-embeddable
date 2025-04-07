import React, { useState, useEffect } from 'react';
import {
  Virtuoso,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcSwitch,
  RcTooltip,
  RcAvatar,
  RcTypography,
  styled,
} from '@ringcentral/juno';
import { CallQueue } from '@ringcentral/juno-icon';
import { BackHeaderView } from '../BackHeaderView';

function CallQueuePresenceItem({
  presence,
  updatePresence,
}) {
  const [acceptCalls, setAcceptCalls] = useState(presence.acceptCalls);
  useEffect(() => {
    setAcceptCalls(presence.acceptCalls);
  }, [presence]);

  let tooltipTitle = '';
  if (!presence.callQueue.editableMemberStatus) {
    tooltipTitle = "This queue does not allow members to change their availability";
  }
  return (
    <RcListItem>
      <RcListItemAvatar>
        <RcAvatar
          iconSymbol={CallQueue}
          color="avatar.global"
          size="xsmall"
        />
      </RcListItemAvatar>
      <RcListItemText
        primary={presence.callQueue.name}
        secondary={`Ext. ${presence.callQueue.extensionNumber}`}
        primaryTypographyProps={{
          title: presence.callQueue.name,
        }}
      />
      <RcListItemSecondaryAction>
        <RcTooltip title={tooltipTitle}>
          <span>
            <RcSwitch
              checked={acceptCalls}
              disabled={!presence.callQueue.editableMemberStatus}
              onChange={(_, checked) => {
                setAcceptCalls(checked);
                updatePresence(checked);
              }}
            />
          </span>
        </RcTooltip>
      </RcListItemSecondaryAction>
    </RcListItem>
  );
}

const StyledText = styled(RcTypography)`
  padding: 32px 16px;
`;

export function CallQueueSettingsPanel({
  onBackButtonClick,
  presences,
  updatePresence,
  sync,
}) {
  useEffect(() => {
    sync();
  }, []);

  const content = presences && presences.length > 0 ? (
    <Virtuoso
      style={{
        height: '100%',
        width: '100%',
      }}
      totalCount={presences.length}
      data={presences}
      itemContent={(index, presence) => (
        <CallQueuePresenceItem
          presence={presence}
          updatePresence={
            (acceptCalls: boolean) => updatePresence(presence.callQueue.id, acceptCalls)
          }
        />
      )}
    />
  ) : (
    <StyledText variant="body1" color="neutral.f06">
      You are not a member of any call queues.
    </StyledText>
  );

  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title="Manage call queue presence"
    >
      {content}
    </BackHeaderView>
  );
}
