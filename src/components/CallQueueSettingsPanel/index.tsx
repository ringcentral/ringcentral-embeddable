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

export function CallQueueSettingsPanel({
  onBackButtonClick,
  presences,
  updatePresence,
  sync,
}) {
  useEffect(() => {
    sync();
  }, []);

  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title="Manage call queue presence"
    >
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
    </BackHeaderView>
  );
}
