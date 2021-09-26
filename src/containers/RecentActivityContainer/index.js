import React from 'react';
import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import RecentActivityPanel from '@ringcentral-integration/widgets/components/RecentActivityPanel';
import dynamicsFont from '@ringcentral-integration/widgets/assets/DynamicsFont/DynamicsFont.scss';
import RecentActivityMessages from '@ringcentral-integration/widgets/components/RecentActivityMessages';
import RecentActivityCalls from '@ringcentral-integration/widgets/components/RecentActivityCalls';
import i18n from '@ringcentral-integration/widgets/modules/RecentActivityUI/i18n';

import RecentActivityItems from '../../components/RecentActivityItems';

import styles from './styles.scss';

function getTabs({
  ready,
  currentLocale,
  dateTimeFormatter,
  navigateTo,
  recentMessages,
  recentCalls,
  currentContact,
  thirdPartyService,
  sessionId,
}) {
  if (!ready) return [];
  let messages = [];
  let calls = [];
  let unreadMessageCounts = 0;
  if (currentContact && currentContact.id) {
    // const contactId = currentContact.id;
    const activityCardId = sessionId ? `${currentContact.id}-${sessionId}` : currentContact.id;
    if (recentMessages.messages[activityCardId]) {
      messages = recentMessages.messages[activityCardId];
    }
    if (recentCalls.calls[activityCardId]) {
      calls = recentCalls.calls[activityCardId];
    }
    if (recentMessages.unreadMessageCounts[activityCardId]) {
      unreadMessageCounts = recentMessages.unreadMessageCounts[activityCardId];
    }
  }
  const tabs = [
    {
      icon: <span className={dynamicsFont.active} />,
      label: i18n.getString('call', currentLocale),
      path: 'recentCalls',
      isActive: path => path === 'recentCalls',
      view: (
        <RecentActivityCalls
          calls={calls}
          dateTimeFormatter={dateTimeFormatter}
          currentLocale={currentLocale}
          isCallsLoaded={recentCalls.isCallsLoaded}
        />
      ),
      getData: () => {
        recentCalls.getCalls({ currentContact, sessionId });
      },
      cleanUp: () => recentCalls.cleanUpCalls({ contact: currentContact, sessionId })
    },
    {
      icon: <span className={dynamicsFont.composeText} />,
      label: i18n.getString('text', currentLocale),
      path: 'recentMessages',
      noticeCounts: unreadMessageCounts,
      isActive: path => path === 'recentMessages',
      view: (
        <RecentActivityMessages
          messages={messages}
          navigateTo={navigateTo}
          dateTimeFormatter={dateTimeFormatter}
          currentLocale={currentLocale}
          isMessagesLoaded={recentMessages.isMessagesLoaded}
        />
      ),
      getData: () => {
        recentMessages.getMessages({ currentContact, sessionId });
      },
      cleanUp: () => recentMessages.cleanUpMessages({ contact: currentContact, sessionId })
    },
  ];
  if (thirdPartyService.activitiesRegistered) {
    tabs.push({
      icon: (
        <span className={styles.title}>
          {thirdPartyService.activityName || thirdPartyService.serviceName}
        </span>
      ),
      label: thirdPartyService.activityName || thirdPartyService.serviceName,
      path: 'thirdPartyService',
      isActive: path => path === 'thirdPartyService',
      view: (
        <RecentActivityItems
          openItem={activity => thirdPartyService.openActivity(activity)}
          isLoaded={thirdPartyService.activitiesLoaded}
          items={thirdPartyService.activities}
          currentLocale={currentLocale}
          dateTimeFormatter={dateTimeFormatter}
        />
      ),
      getData: () => {
        thirdPartyService.fetchActivities(currentContact);
      },
      cleanUp: () => {}
    });
  }
  return tabs;
}

function mapToProps(_, {
  phone: {
    locale,
    dateTimeFormat,
    recentMessages,
    recentCalls,
    contactMatcher,
    thirdPartyService,
  },
  currentLocale = locale.currentLocale,
  navigateTo,
  dateTimeFormatter = (...args) => dateTimeFormat.formatDateTime(...args),
  getSession,
  contact = null,
  useContact = false,
}) {
  let sessionId = null;
  let currentContact = contact;
  let ready =
    dateTimeFormat.ready &&
    locale.ready &&
    recentMessages.ready &&
    recentCalls.ready;
  if (!useContact) {
    const session = getSession();
    sessionId = session.id;
    currentContact = session.contactMatch;
    const contactMapping = contactMatcher && contactMatcher.dataMapping;
    const phoneNumber = session.direction === callDirections.outbound ?
      session.to : session.from;
    if (!currentContact) {
      currentContact = contactMapping && contactMapping[phoneNumber];
      if (currentContact && currentContact.length >= 1) {
        currentContact = currentContact[0];
      }
    }
    ready = ready && contactMatcher.ready;
  }
  return {
    currentLocale,
    title: i18n.getString('recentActivities', locale.currentLocale),
    showSpinner: !ready,
    currentContact,
    calls: recentCalls.calls || [],
    tabs: getTabs({
      ready,
      currentLocale,
      dateTimeFormatter,
      navigateTo,
      currentContact,
      recentMessages,
      recentCalls,
      thirdPartyService,
      sessionId,
    }),
    defaultTab: 'recentCalls',
  };
}

export default withPhone(connect(mapToProps)(RecentActivityPanel));
