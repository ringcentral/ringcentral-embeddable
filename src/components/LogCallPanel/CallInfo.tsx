import React from 'react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import telephonyStatuses from '@ringcentral-integration/commons/enums/telephonyStatus';
import { isInbound, isMissed } from '@ringcentral-integration/commons/lib/callLogHelpers';
import {
  RcListItem,
  RcListItemText,
  RcListItemIcon,
  RcListItemSecondaryAction,
  RcTypography,
  styled,
  palette2,
  shadows,
} from '@ringcentral/juno';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import DurationCounter from '@ringcentral-integration/widgets/components/DurationCounter';
import { ShinyBar } from '@ringcentral-integration/widgets/components/LogBasicInfoV2/ShinyBar';
import i18n from '@ringcentral-integration/widgets/components/LogBasicInfoV2/i18n';
import { CallIcon } from '../CallItem/CallIcon';

const Container = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: ${shadows('3')};
`;

const StyledItem = styled(RcListItem)`
  background: ${palette2('neutral', 'b03')};
  user-select: auto;
  cursor: auto;

  .RcListItemText-primary {
    font-size: 1rem;
    margin-bottom: 3px;
  }
`;

const StyledItemIcon = styled(RcListItemIcon)`
  .icon {
    font-size: 22px;
  }
`;

const StyledSecondary = styled(RcListItemSecondaryAction)`
  display: flex;
  flex-direction: column;
`;

const TimeInfo = styled(RcTypography)`
  margin: 0;
  line-height: 22px;
`;

function getInfoStatus(status) {
  switch (status) {
    case telephonyStatuses.onHold:
      return 'onHold';
    case telephonyStatuses.callConnected:
    case telephonyStatuses.ringing:
      return 'active';
    default:
      return 'callEnd';
  }
}

function Duration({ startTime, offset, duration = undefined }) {
  if (typeof duration === 'undefined') {
    return (
      <DurationCounter startTime={startTime} offset={offset} />
    );
  }
  return formatDuration(duration);
}

const StyledShinyBar = styled(ShinyBar)`
  position: relative;
`;

export function CallInfo({
  formatPhone,
  call,
  dateTimeFormatter,
  currentLocale,
}) {
  const phoneNumber = call.direction === callDirections.outbound ?
    call.to && (call.to.phoneNumber || call.to.extensionNumber)
    : call.from && (call.from.phoneNumber || call.from.extensionNumber);
  const status = call.result || call.telephonyStatus;
  const isRinging = status === telephonyStatuses.ringing;

  return (
    <Container>
      <StyledShinyBar
        isRinging={isRinging}
        status={getInfoStatus(status)}
      />
      <StyledItem
        disableTouchRipple
        component="div"
      >
        <StyledItemIcon>
          <CallIcon
            direction={call.direction}
            missed={isInbound(call) && isMissed(call)}
            type={call.type}
          />
        </StyledItemIcon>
        <RcListItemText
          primary={formatPhone(phoneNumber)}
          secondary={
            i18n.getString(status, currentLocale)
          }
        />
        <StyledSecondary>
          <TimeInfo variant='caption1'>
            <Duration
              duration={call.duration}
              startTime={call.startTime}
              offset={call.offset}
            />
          </TimeInfo>
          <TimeInfo variant='caption1'>
            {dateTimeFormatter({
              utcTimestamp: call.startTime,
              locale: currentLocale,
            })}
          </TimeInfo>
        </StyledSecondary>
      </StyledItem>
    </Container>
  );
}