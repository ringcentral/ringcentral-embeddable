import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';

import { MainViewPanel } from '../../components/MainViewPanel';

function mapToProps(_, {
  phone: {
    locale,
    messageStore,
    appFeatures,
    routerInteraction,
    glipGroups,
    glipCompany,
    genericMeeting,
    brand,
  },
}) {
  const unreadCounts = messageStore.unreadCounts || 0;
  const showCall = appFeatures.ready && appFeatures.isCallingEnabled;
  const showMessages = appFeatures.ready && appFeatures.hasReadMessagesPermission;
  const showMeeting = (
    appFeatures.ready &&
    appFeatures.hasMeetingsPermission
  );

  const { currentLocale } = locale;
  const showContacts = appFeatures.ready && appFeatures.isContactsEnabled;
  const showHistory = appFeatures.ready && appFeatures.hasReadExtensionCallLog;

  return {
    currentLocale,
    unreadCounts,
    showCall,
    showHistory,
    showMessages,
    showMeeting,
    isRCV: genericMeeting.isRCV,
    showContacts,
    showGlip: (appFeatures.hasGlipPermission && !!glipCompany.name),
    glipUnreadCounts: glipGroups.unreadCounts,
    currentPath: routerInteraction.currentPath,
    rcvProductName: brand.rcvProductName,
  };
}
function mapToFunctions(_, {
  phone: {
    routerInteraction,
  }
}) {
  return {
    goTo: (path) => {
      if (path) {
        routerInteraction.push(path);
      }
    },
  };
}

const MainView = withPhone(connect(
  mapToProps,
  mapToFunctions
)(MainViewPanel));

export default MainView;
