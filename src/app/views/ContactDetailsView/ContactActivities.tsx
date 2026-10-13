import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { AppsMd } from '@ringcentral/spring-icon';
import {
  CircularProgressIndicator,
  EmptyState,
  List,
  ListItem,
  ListItemText,
} from '@ringcentral/spring-ui';
import React, { useEffect } from 'react';

import type { ContactActivity } from './ContactDetails.interface';
import i18n from './i18n';

interface ContactActivitiesProps {
  activities: ContactActivity[];
  loaded: boolean;
  loadActivities: () => void;
  openActivity: (activity: ContactActivity) => void;
  formatTime: (time: number) => string;
}

/**
 * Activities from the third-party service for the contact, loaded when the
 * tab opens. Clicking an item asks the service to open it.
 */
export function ContactActivities({
  activities,
  loaded,
  loadActivities,
  openActivity,
  formatTime,
}: ContactActivitiesProps): React.ReactElement {
  const { t } = useLocale(i18n);
  useEffect(() => {
    loadActivities();
    // Load once per tab open; the contact page remounts for another contact.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!loaded) {
    return (
      <div className="flex justify-center py-6" data-sign="activitiesLoading">
        <CircularProgressIndicator
          size="medium"
          progressBarProps={{ 'aria-label': t('loadingActivities') }}
        />
      </div>
    );
  }
  if (activities.length === 0) {
    return (
      <div className="py-6" data-sign="activitiesEmpty">
        <EmptyState icon={AppsMd} title={t('noActivities')} />
      </div>
    );
  }
  return (
    <List data-sign="activitiesList">
      {activities.map((activity, index) => (
        <ListItem
          key={activity.id ?? index}
          size="large"
          divider={index < activities.length - 1}
          data-sign="activityItem"
          onClick={() => openActivity(activity)}
        >
          <ListItemText
            primary={<span title={activity.subject}>{activity.subject}</span>}
            secondary={
              typeof activity.time === 'number' ? formatTime(activity.time) : ''
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
