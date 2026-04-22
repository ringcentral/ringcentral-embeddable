import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components';
import {
  CallMd,
  IncomingCallMd,
  ParkCallMd,
  Smsmd,
  TrashMd,
} from '@ringcentral/spring-icon';
import {
  Chip,
  IconButton,
  ListItem,
  ListItemText,
  StatusIndicator,
  Text,
  Tooltip,
} from '@ringcentral/spring-ui';
import React, { useEffect, useRef, useState } from 'react';

import type {
  MonitoredExtensionItem,
  PresenceActiveCall,
} from '../../services/MonitoredExtensions/MonitoredExtensions.interface';
import { t } from './i18n';

function getPresenceType(presence?: { presenceStatus?: string; telephonyStatus?: string }) {
  if (!presence) return 'offline';
  if (presence.telephonyStatus === 'Ringing' || presence.telephonyStatus === 'CallConnected') {
    return 'busy';
  }
  switch (presence.presenceStatus) {
    case 'Available':
      return 'available';
    case 'Busy':
      return 'busy';
    case 'DoNotDisturb':
      return 'DND';
    case 'Offline':
      return 'offline';
    default:
      return 'offline';
  }
}

function ExtensionAvatar({
  extension,
  presence,
}: {
  extension: MonitoredExtensionItem['extension'];
  presence?: MonitoredExtensionItem['presence'];
}) {
  const presenceType = getPresenceType(presence);

  if (extension.type === 'User') {
    return (
      <div className="relative mr-3 flex-shrink-0">
        <ContactAvatar
          url={extension.profileImageUrl}
          contactName={extension.name}
          size="small"
        />
        <StatusIndicator
          variant={presenceType as any}
          className="absolute -bottom-0.5 -right-0.5"
        />
      </div>
    );
  }

  if (extension.type === 'ParkLocation') {
    return (
      <div className="relative mr-3 flex-shrink-0">
        <StatusIndicator
          variant={
            (presence?.activeCalls?.length ?? 0) > 0 ? 'busy' : 'available'
          }
        />
      </div>
    );
  }

  return (
    <div className="mr-3 flex-shrink-0">
      <ContactAvatar
        contactName={extension.name}
        isDepartment={extension.type === 'Department'}
        size="small"
      />
    </div>
  );
}

function getCallContactName(
  call: PresenceActiveCall,
  formatPhone: (phone: string) => string,
) {
  const from =
    call.direction === callDirections.inbound ? call.from : call.to;
  const fromName =
    call.direction === callDirections.inbound ? call.fromName : call.toName;
  return fromName || formatPhone(from);
}

function DurationCounter({ startTime }: { startTime: string }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(new Date(startTime).getTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return (
    <span>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  );
}

function ActiveCallBadge({
  call,
  formatPhone,
  detailsInTooltip = false,
  isGroupCall = false,
}: {
  call: PresenceActiveCall;
  formatPhone: (phone: string) => string;
  detailsInTooltip?: boolean;
  isGroupCall?: boolean;
}) {
  let statusText = t('activeCall');
  let color: 'default' | 'error' = 'error';

  if (call.telephonyStatus === 'OnHold') {
    color = 'default';
    statusText = t('onHold');
  } else if (call.telephonyStatus === 'ParkedCall') {
    statusText = t('parked');
  } else if (call.telephonyStatus === 'Ringing') {
    if (call.direction === callDirections.inbound) {
      statusText = t('incomingCall');
      color = 'default';
    }
  }

  const duration = call.startTime ? (
    <DurationCounter startTime={call.startTime} />
  ) : null;

  const label = detailsInTooltip ? statusText : (
    <span>
      {statusText} {duration}
    </span>
  );

  const contactName = getCallContactName(call, formatPhone);
  const tooltipContent = detailsInTooltip
    ? `${statusText} ${contactName}`
    : '';

  return (
    <Tooltip title={tooltipContent}>
      <Chip
        label={label}
        color={color}
        size="small"
        className="mr-1"
      />
    </Tooltip>
  );
}

function ExtensionCallStatus({
  extension,
  presence,
  formatPhone,
}: {
  extension: MonitoredExtensionItem['extension'];
  presence?: MonitoredExtensionItem['presence'];
  formatPhone: (phone: string) => string;
}) {
  const activeCalls = presence?.activeCalls ?? [];
  const isGroupCall = extension.type === 'GroupCallPickup';

  if (activeCalls.length === 0) {
    if (extension.type === 'User' && presence) {
      return (
        <Text
          component="span"
          className="typography-caption text-neutral-f04 truncate"
        >
          {presence.presenceStatus}
        </Text>
      );
    }
    if (extension.type === 'ParkLocation') {
      return (
        <div className="flex items-center gap-1">
          <Chip
            label={t('available')}
            size="small"
          />
          <Text
            component="span"
            className="typography-caption text-neutral-f04 truncate"
          >
            {t('youCanParkCallHere')}
          </Text>
        </div>
      );
    }
    return null;
  }

  if (activeCalls.length === 1) {
    const call = activeCalls[0];
    const contactName = getCallContactName(call, formatPhone);
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        <ActiveCallBadge
          call={call}
          formatPhone={formatPhone}
          isGroupCall={isGroupCall}
        />
        <Text
          component="span"
          className="typography-caption text-neutral-f04 truncate"
        >
          {t('with', { contactName })}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {activeCalls.map((call) => (
        <ActiveCallBadge
          key={call.id}
          call={call}
          formatPhone={formatPhone}
          detailsInTooltip
          isGroupCall={isGroupCall}
        />
      ))}
    </div>
  );
}

export function ExtensionItem({
  item,
  formatPhone,
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
}: {
  item: MonitoredExtensionItem;
  formatPhone: (phone: string) => string;
  onClickToDial: (recipient: {
    name?: string;
    id: string;
    phoneNumber: string;
  }) => void;
  disableClickToDial: boolean;
  canPark: boolean;
  onPark: (extension: { id: string; name?: string; extensionNumber?: string }) => void;
  onText: (text: string) => void;
  pickParkLocation: (
    extension: { id: string },
    activeCall: PresenceActiveCall,
  ) => void;
  pickGroupCall: (
    extension: { id: string },
    activeCall: PresenceActiveCall,
  ) => void;
  pickCallQueueCall: (
    extension: { id: string },
    activeCall: PresenceActiveCall,
  ) => void;
  onRemoveExtension: (extensionId: string, extensionName: string, isParkLocation: boolean) => void;
  canEdit: boolean;
}) {
  const { extension, presence } = item;
  const isDisabled = extension.status !== 'Enabled';

  const hoverActions: React.ReactNode[] = [];

  if (
    extension.type === 'User' &&
    extension.extensionNumber &&
    !isDisabled
  ) {
    hoverActions.push(
      <IconButton
        key="c2d"
        className="ml-2"
        variant="outlined"
        color="secondary"
        size="medium"
        symbol={CallMd}
        disabled={disableClickToDial}
        data-sign="callExtension"
        TooltipProps={{ title: t('call') }}
        onClick={() =>
          onClickToDial({
            name: extension.name,
            id: extension.id,
            phoneNumber: extension.extensionNumber!,
          })
        }
      />,
    );
  }

  if (extension.type === 'ParkLocation' && !isDisabled) {
    if ((presence?.activeCalls?.length ?? 0) === 0 && canPark) {
      hoverActions.push(
        <IconButton
          key="park"
          className="ml-2"
          variant="outlined"
          color="secondary"
          size="medium"
          symbol={ParkCallMd}
          data-sign="parkCall"
          TooltipProps={{ title: t('parkCurrentCall') }}
          onClick={() => onPark(extension)}
        />,
      );
    }
    if ((presence?.activeCalls?.length ?? 0) > 0) {
      const activeCall = presence!.activeCalls[0];
      const contactName = getCallContactName(activeCall, formatPhone);
      hoverActions.push(
        <IconButton
          key="pickup"
          className="ml-2"
          variant="outlined"
          color="secondary"
          size="medium"
          symbol={IncomingCallMd}
          data-sign="pickParkLocation"
          TooltipProps={{ title: t('pickUpCall') }}
          onClick={() => pickParkLocation(extension, activeCall)}
        />,
      );
      hoverActions.push(
        <IconButton
          key="sms"
          className="ml-2"
          variant="outlined"
          color="secondary"
          size="medium"
          symbol={Smsmd}
          data-sign="notifyByText"
          TooltipProps={{ title: t('notifyByText') }}
          onClick={() =>
            onText(
              t('callFrom', {
                contactName,
                location: extension.name || extension.extensionNumber || '',
              }),
            )
          }
        />,
      );
    }
  }

  if (extension.type === 'GroupCallPickup' && !isDisabled) {
    if ((presence?.activeCalls?.length ?? 0) > 0) {
      const activeCall = presence!.activeCalls[0];
      hoverActions.push(
        <IconButton
          key="pickGroupCall"
          className="ml-2"
          variant="outlined"
          color="secondary"
          size="medium"
          symbol={IncomingCallMd}
          data-sign="pickGroupCall"
          TooltipProps={{ title: t('pickUpCall') }}
          onClick={() => pickGroupCall(extension, activeCall)}
        />,
      );
    }
  }

  if (extension.type === 'Department' && !isDisabled) {
    if ((presence?.activeCalls?.length ?? 0) > 0) {
      const activeCall = presence!.activeCalls[0];
      hoverActions.push(
        <IconButton
          key="pickQueueCall"
          className="ml-2"
          variant="outlined"
          color="secondary"
          size="medium"
          symbol={IncomingCallMd}
          data-sign="pickCallQueueCall"
          TooltipProps={{ title: t('pickUpCall') }}
          onClick={() => pickCallQueueCall(extension, activeCall)}
        />,
      );
    }
  }

  if (
    canEdit &&
    (extension.type === 'User' || extension.type === 'ParkLocation')
  ) {
    hoverActions.push(
      <IconButton
        key="remove"
        className="ml-2"
        variant="outlined"
        color="secondary"
        size="medium"
        symbol={TrashMd}
        data-sign="removeExtension"
        TooltipProps={{ title: t('remove') }}
        onClick={() =>
          onRemoveExtension(
            extension.id,
            extension.name || extension.extensionNumber || '',
            extension.type === 'ParkLocation',
          )
        }
      />,
    );
  }

  const extensionNumberText = extension.extensionNumber
    ? `Ext.${extension.extensionNumber}`
    : undefined;

  return (
    <>
      <ListItem
        data-sign={`extensionItem-${extension.id}`}
        divider
        size="auto"
        className={isDisabled ? 'opacity-50 pointer-events-none' : ''}
        hoverActions={
          hoverActions.length > 0 ? (
            <div className="flex items-center gap-1">{hoverActions}</div>
          ) : undefined
        }
      >
        <ExtensionAvatar extension={extension} presence={presence} />
        <ListItemText
          primary={
            <div className="flex items-center justify-between">
              <span className="truncate flex-1">{extension.name}</span>
              {extensionNumberText && (
                <Text
                  component="span"
                  className="typography-descriptor text-neutral-f04 ml-2 flex-shrink-0"
                >
                  {extensionNumberText}
                </Text>
              )}
            </div>
          }
          secondary={
            <ExtensionCallStatus
              extension={extension}
              presence={presence}
              formatPhone={formatPhone}
            />
          }
        />
      </ListItem>
    </>
  );
}
