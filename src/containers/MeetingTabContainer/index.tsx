import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';
import { SubTabsView } from '../../components/SubTabsView';

import i18n from './i18n';

function mapToProps(_, { phone, phone: { locale, routerInteraction } }) {
  return {
    currentPath: routerInteraction.currentPath,
    tabs: [
      {
        value: '/meeting/home',
        label: i18n.getString('home', locale.currentLocale),
      },
      {
        value: '/meeting/history',
        label: i18n.getString('recent', locale.currentLocale),
      },
      {
        value: '/meeting/recordings',
        label: i18n.getString('recordings', locale.currentLocale),
      }
    ]
  };
}

function mapToFunctions(_, { phone: { routerInteraction } }) {
  return {
    goTo(path) {
      routerInteraction.push(path);
    },
  };
}

const MeetingTabContainer = withPhone(
  connect(
    mapToProps,
    mapToFunctions,
  )(SubTabsView),
);

export { mapToProps, mapToFunctions, MeetingTabContainer as default };
