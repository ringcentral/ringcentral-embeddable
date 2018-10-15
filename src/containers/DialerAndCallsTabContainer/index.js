import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import withPhone from 'ringcentral-widgets/lib/withPhone';
import TabContentPanel from 'ringcentral-widgets/components/TabContentPanel';
import SpinnerOverlay from 'ringcentral-widgets/components/SpinnerOverlay';
import i18n from 'ringcentral-widgets/containers/DialerAndCallsTabContainer/i18n';
import styles from 'ringcentral-widgets/containers/DialerAndCallsTabContainer/styles.scss';

function hasActiveCalls(phone) {
  const {
    callMonitor,
    webphone,
    callLogSection,
    callMonitorUI,
  } = phone;
  return !!(
    // (callMonitor && callMonitor.calls.length) &&
    (webphone && webphone.sessions.length)
  ) || !!(
    (callMonitor && callMonitor.calls.length)
    || (callLogSection && callLogSection.showNotification)
    // || (callLogSection && callLogSection.show)
    || (callMonitorUI && callMonitorUI.cachedActive)
  );
}

class TabContentView extends Component {
  static propTypes = {
    applicable: PropTypes.bool.isRequired,
    showSpinner: PropTypes.bool.isRequired,
    currentLocale: PropTypes.string.isRequired,
    currentPath: PropTypes.string.isRequired,
    goTo: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.getTabs = createSelector(
      () => this.props.currentLocale,
      () => this.props.currentPath,
      (currentLocale, currentPath) => ([
        {
          path: '/dialer',
          label: i18n.getString('dialer', currentLocale),
          isActive() { return currentPath === '/dialer'; },
        },
        {
          path: '/calls',
          label: i18n.getString('allCalls', currentLocale),
          isActive() { return currentPath === '/calls'; }
        },
      ]),
    );
  }
  render() {
    if (this.props.showSpinner) {
      return <SpinnerOverlay />;
    }
    return (
      <TabContentPanel
        {...this.props}
        tabs={this.getTabs()}
        navClassName={styles.nav}
        tabContentClassName={styles.content}
      />
    );
  }
}

function mapToProps(_, {
  phone,
  phone: {
    locale,
    routerInteraction,
  },
}) {
  return {
    applicable: hasActiveCalls(phone),
    currentLocale: locale.currentLocale,
    showSpinner: !locale.ready,
    currentPath: routerInteraction.currentPath,
  };
}

function mapToFunctions(_, {
  phone: {
    routerInteraction,
  },
}) {
  return {
    goTo(path) {
      routerInteraction.push(path);
    },
  };
}

const DialerAndCallsTabContainer = withPhone(connect(
  mapToProps,
  mapToFunctions,
)(TabContentView));

export {
  mapToProps,
  mapToFunctions,
  DialerAndCallsTabContainer as default,
};
