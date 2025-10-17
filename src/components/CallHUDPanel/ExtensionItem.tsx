import React, { useState } from 'react';
import {
  palette2,
  styled,
  RcListItem,
  RcListItemText,
  RcText,
  RcIcon,
  RcAvatar,
  RcListItemAvatar,
  RcPresence,
  RcChip,
  RcTooltip,
} from '@ringcentral/juno';
import {
  DefaultGroupAvatar,
  People,
  PhoneBorder,
  ParkCallSp,
  SmsBorder,
  PickUpCall,
  CallQueue,
  Delete,
} from '@ringcentral/juno-icon';
import { getPresenceStatus } from '@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper';
import { getPresenceStatusName } from '@ringcentral-integration/widgets/lib/getPresenceStatusName';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import DurationCounter from '@ringcentral-integration/widgets/components/DurationCounter';
import { ActionMenu } from '../ActionMenu';
import { ConfirmDialog } from '../ConfirmDialog';

const Container = styled.div`
  position: relative;

  .action-menu {
    display: none;
  }

  .extension-name {
    flex: 1;
  }

  .extension-number {
    text-align: right;
  }

  &:hover {
    .action-menu {
      display: flex;
    }

    .extension-number {
      display: none;
    }
  }
`;

const StyledListItem = styled(RcListItem)`
  height: 58px;

  &::after {
    content: "";
    position: absolute;
    bottom: 0px;
    width: calc(100% - 32px);
    border-bottom: 1px solid ${palette2('neutral', 'l02')};
  }
`;

const StyledActionMenu = styled(ActionMenu)`
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -16px;

  .RcIconButton-root {
    margin-left: 8px;
  }
`;

const StyledChip = styled(RcChip)`
  margin-right: 4px;
  font-size: 0.75rem;
  height: 18px;
  line-height: 16px;
  padding: 0;
`;

const ItemLine = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
  flex-direction: row;
`;

function ExtensionAvatar({ extension, presence }) {
  const presenceProps = presence ? {
    type: getPresenceStatus(presence),
  } : undefined;
  if (extension.type === 'User') {
    return (
      <RcListItemAvatar>
        <RcAvatar
          size="xsmall"
          src={extension.profileImageUrl}
          color="avatar.global"
          presenceProps={presenceProps}
        >
          {
            extension.profileImageUrl ? null : (
              <RcIcon symbol={People} size="medium" />
            )
          }
        </RcAvatar>
      </RcListItemAvatar>
    );
  }

  if (extension.type === 'ParkLocation') {
    return (
      <RcListItemAvatar>
        <RcPresence type={presenceProps ? presenceProps.type : 'unavailable'} />
      </RcListItemAvatar>
    );
  }

  let icon;
  if (extension.type === 'Department') {
    icon = CallQueue;
  } else {
    icon = DefaultGroupAvatar;
  }
  return (
    <RcListItemAvatar>
      <RcAvatar color="avatar.global" size="xsmall">
        <RcIcon symbol={icon} size="large" />
      </RcAvatar>
    </RcListItemAvatar>
  );
}

function getCallContactName(call, formatPhone) {
  const from = call.direction === callDirections.inbound ? call.from : call.to;
  const fromName = call.direction === callDirections.inbound ? call.fromName : call.toName;
  return fromName || formatPhone(from);
}

function getCallDescription(call, formatPhone, isGroupCall = false) {
  const contactName = getCallContactName(call, formatPhone);
  if (call.telephonyStatus === 'ParkedCall') {
    return `Call from ${contactName}`;
  }
  if (call.telephonyStatus === 'Ringing') {
    if (isGroupCall) {
      const to = call.direction === callDirections.inbound ? call.to : call.from;
      const toName = call.direction === callDirections.inbound ? call.toName : call.fromName;
      return `from ${contactName} to ${toName || to}`;
    }
    return `from ${contactName}`;
  }
  return `with ${contactName}`;
}

function ActiveCallBadge({ call, formatPhone, detailsInTooltip = false, isGroupCall = false }) {
  let callStatusText = 'Active call';
  let color = 'danger.f02';
  if (call.telephonyStatus === 'OnHold') {
    color = 'warning.f02';
    callStatusText = 'On hold';
  } else if (call.telephonyStatus === 'ParkedCall') {
    callStatusText = 'Parked';
  } else if (call.telephonyStatus === 'Ringing') {
    if (call.direction === callDirections.inbound) {
      callStatusText = 'Incoming call';
      color = 'success.f02';
    }
  }
  let label;
  let tooltip;
  const duration = call.startTime ? (
    <DurationCounter startTime={new Date(call.startTime).getTime()} offset={call.offset || 0} />
  ) : null;
  if (!detailsInTooltip) {
    label = (
      <span>
        {callStatusText}
        &nbsp;
        {duration}
      </span>
    );
    tooltip = '';
  } else {
    label = callStatusText;
    tooltip = (
      <span>
        {callStatusText}
        &nbsp;
        {duration}
        &nbsp;
        {getCallDescription(call, formatPhone, isGroupCall)}
      </span>
    )
  }
  return (
    <RcTooltip title={tooltip}>
      <StyledChip label={label} color={color} variant="outlined" />
    </RcTooltip>
  );
}

function ExtensionCallStatus({ extension, presence, formatPhone, currentLocale }) {
  const activeCalls = presence?.activeCalls || [];
  let description;
  let badges = [];
  const isGroupCall = extension.type === 'GroupCallPickup';
  if (activeCalls.length === 0) {
    if (extension.type === 'User') {
      description = presence ? getPresenceStatusName(
        presence.presenceStatus,
        presence.dndStatus,
        currentLocale,
      ) : undefined
    }
    if (extension.type === 'ParkLocation') {
      badges.push(<StyledChip label="Available" color="success.f02" variant="outlined" />);
      description = 'You can park call here';
    }
  } else if (activeCalls.length === 1) {
    const call = activeCalls[0];
    description = getCallDescription(call, formatPhone, isGroupCall);
    badges.push(<ActiveCallBadge call={call} formatPhone={formatPhone} isGroupCall={isGroupCall} />);
  } else if (activeCalls.length > 1) {
    description = '';
    activeCalls.forEach((call) => {
      badges.push(<ActiveCallBadge call={call} formatPhone={formatPhone} detailsInTooltip isGroupCall={isGroupCall} />);
    });
  }
  if (!description && badges.length === 0) {
    return null;
  }
  return (
   <ItemLine>
    {badges}
    {
      description ? (
        <RcText variant="caption1" color="neutral.f04" component="span" title={description}>
          {description}
        </RcText>
      ) : null
    }
   </ItemLine>
  );
}

function ExtensionDescription({ extension, presence, formatPhone, currentLocale }) {
  const name = extension.extensionNumber ? (
    <ItemLine>
      <span className="extension-name">{extension.name}</span>
      <RcText variant="caption1" color="neutral.f06" className="extension-number" component="span">
        Ext.{extension.extensionNumber}
      </RcText>
    </ItemLine>
  ) : extension.name;

  if (extension.status !== 'Enabled') {
    return (
      <RcListItemText
        primary={name}
      />
    );
  }
  return (
    <RcListItemText
      primary={name}
      secondary={
        <ExtensionCallStatus
          extension={extension}
          presence={presence}
          formatPhone={formatPhone}
          currentLocale={currentLocale}
        />
      }
      secondaryTypographyProps={{
        component: 'div',
      }}
    />
  );
}

export function ExtensionItem({
  item,
  formatPhone,
  currentLocale,
  onClickToDial,
  disableClickToDial,
  canPark,
  onPark,
  onText,
  pickParkLocation,
  pickGroupCall,
  pickCallQueueCall,
  onRemoveExtension,
  canEdit,
}) {
  const [removeExtensionConfirmOpen, setRemoveExtensionConfirmOpen] = useState(false);
  const { extension, presence } = item;
  const actions = [];
  if (extension.type === 'User' && extension.extensionNumber && extension.status === 'Enabled') {
    actions.push({
      id: 'c2d',
      icon: PhoneBorder,
      title: 'Call',
      disabled: disableClickToDial,
      onClick: () => {
        onClickToDial({
          name: extension.name,
          id: extension.id,
          phoneNumber: extension.extensionNumber,
        })
      },
    });
  }
  if (extension.type === 'ParkLocation' && extension.status === 'Enabled') {
    if (presence?.activeCalls?.length === 0 && canPark) {
      actions.push({
        id: 'park',
        icon: ParkCallSp,
        title: 'Park current call',
        onClick: () => {
          onPark(extension);
        },
      });
    }
    if (presence?.activeCalls?.length > 0) {
      const activeCall = presence?.activeCalls[0];
      const contactName = getCallContactName(activeCall, formatPhone);
      actions.push({
        id: 'pickParkLocation',
        icon: PickUpCall,
        title: 'Pick up call',
        onClick: () => {
          pickParkLocation(extension, activeCall);
        },
      });
      actions.push({
        id: 'sms',
        icon: SmsBorder,
        title: 'Notify by text',
        onClick: () => {
          onText(`You have a call from ${contactName} at ${extension.name || extension.extensionNumber}`);
        },
      });
    }
  }
  if (canEdit && (extension.type === 'User' || extension.type === 'ParkLocation')) {
    actions.push({
      id: 'removeExtension',
      icon: Delete,
      title: 'Remove',
      onClick: () => {
        setRemoveExtensionConfirmOpen(true);
      },
    });
  }
  if (extension.type === 'GroupCallPickup' && extension.status === 'Enabled') {
    if (presence?.activeCalls?.length > 0) {
      const activeCall = presence?.activeCalls[0];
      actions.push({
        id: 'pickGroupCall',
        icon: PickUpCall,
        title: 'Pick up call',
        onClick: () => {
          pickGroupCall(extension, activeCall);
        },
      });
    }
  }
  if (extension.type === 'Department' && extension.status === 'Enabled') {
    if (presence?.activeCalls?.length > 0) {
      const activeCall = presence?.activeCalls[0];
      actions.push({
        id: 'pickCallQueueCall',
        icon: PickUpCall,
        title: 'Pick up call',
        onClick: () => {
          pickCallQueueCall(extension, activeCall);
        },
      });
    }
  }
  return (
    <Container>
      <StyledListItem
        disabled={extension.status !== 'Enabled'}
      >
        <ExtensionAvatar
          extension={extension}
          presence={presence}
        />
        <ExtensionDescription
          extension={extension}
          presence={presence}
          formatPhone={formatPhone}
          currentLocale={currentLocale}
        />
      </StyledListItem>
      {
        actions.length > 0 && (
          <StyledActionMenu
            actions={actions}
            size="small"
            maxActions={3}
            className="action-menu"
            iconVariant="contained"
            color="neutral.b01"
          />
        )
      }
      {
        (extension.type === 'User' || extension.type === 'ParkLocation') && (
          <ConfirmDialog
            open={removeExtensionConfirmOpen}
            onClose={() => setRemoveExtensionConfirmOpen(false)}
            onConfirm={() => onRemoveExtension(extension.id)}
            title={
              extension.type === 'User' ? 
              `Do you want to remove ${extension.name} from your HUD list?` : 
              `Are you sure you want to remove ${extension.name} from your park locations?`
            }
            confirmText="Remove"
            confirmButtonColor="danger.b04"
          />
        )
      }
    </Container>
  );
}
