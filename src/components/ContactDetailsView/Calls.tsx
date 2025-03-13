import React, { useEffect } from 'react';
import {
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemIcon,
  RcListItemSecondaryAction,
  RcIcon,
  RcLoading,
  styled,
} from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/RecentActivityCalls/i18n';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import {
  MissedcallBorder,
  IncallBorder,
  OutcallBorder,
} from '@ringcentral/juno-icon';

function getCallInfo({ direction, result }, currentLocale) {
  if (direction === 'Inbound') {
    if (result === 'Missed') {
      return {
        status: i18n.getString('missed', currentLocale),
        icon: MissedcallBorder,
        missed: true,
      };
    }
    return {
      status: i18n.getString('inBound', currentLocale),
      icon: IncallBorder,
    };
  }
  return {
    status: i18n.getString('outBound', currentLocale),
    icon: OutcallBorder,
  };
}

const Container = styled(RcList) `
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export function Calls({
  calls,
  loaded,
  currentLocale,
  loadCalls,
  clearCalls,
  dateTimeFormatter,
}) {
  useEffect(() => {
    loadCalls();
    return () => clearCalls();
  }, []);
  return (
    <RcLoading loading={!loaded}>
      <Container>
        {calls.map((call) => {
          const info = getCallInfo(call, currentLocale);
          const time = dateTimeFormatter({
            utcTimestamp: new Date(call.startTime).getTime(),
          });
          return (
            <RcListItem key={call.id}>
              <RcListItemIcon>
                <RcIcon symbol={info.icon} color={info.missed ? 'danger.f02' : undefined} />
              </RcListItemIcon>
              <RcListItemText
                primary={info.status}
                secondary={formatDuration(call.duration)}
                primaryTypographyProps={{
                  color: info.missed ? 'danger.f02' : 'neutral.f06',
                }}
              />
              <RcListItemSecondaryAction>
                {time}
              </RcListItemSecondaryAction>
            </RcListItem>
          );
        })}
        {
          loaded && calls.length === 0 && (
            <RcListItem>
              <RcListItemText
                primary={i18n.getString('noRecords', currentLocale)}
              />
            </RcListItem>
          )
        }
      </Container>
    </RcLoading>
  );
}
