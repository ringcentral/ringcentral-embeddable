import React, { useEffect } from 'react';
import {
  RcList,
  RcListItem,
  RcListItemText,
  RcLoading,
  styled,
} from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/RecentActivityMessages/i18n';

const Container = styled(RcList) `
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export function Activities({
  activities,
  loaded,
  loadActivities,
  clearActivities,
  openItem,
  currentLocale,
  dateTimeFormatter,
}) {
  useEffect(() => {
    loadActivities();
    return () => {
      return clearActivities();
    };
  }, []);
  return (
    <RcLoading loading={!loaded}>
      <Container>
        {
          activities.map((activity) => {
            const { subject, time, id } = activity;
            const formattedTime = time ? dateTimeFormatter({ utcTimestamp: time }) : '';
            return (
              <RcListItem
                key={id}
                button={typeof openItem === 'function'}
                onClick={() => {
                  if (typeof openItem !== 'function') {
                    return;
                  }
                  openItem(activity);
                }}
              >
                <RcListItemText
                  primary={subject}
                  secondary={formattedTime}
                  primaryTypographyProps={{
                    title: activity.subject,
                    color: 'neutral.f06',
                  }}
                />
              </RcListItem>
            );
          })
        }
        {
          loaded && activities.length === 0 && (
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
