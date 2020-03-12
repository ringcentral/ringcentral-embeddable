import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import withPhone from 'ringcentral-widgets/lib/withPhone';
import TabContentPanel from 'ringcentral-widgets/components/TabContentPanel';
import SpinnerOverlay from 'ringcentral-widgets/components/SpinnerOverlay';
import i18n from './i18n';
import styles from './styles.scss';

class TabContentView extends Component {
  static propTypes = {
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
      (currentLocale, currentPath) => [
        {
          path: '/meeting/home',
          label: i18n.getString('schedule', currentLocale),
          isActive() {
            return currentPath === '/meeting/home';
          },
        },
        {
          path: '/meeting/recordings',
          label: i18n.getString('recordings', currentLocale),
          isActive() {
            return currentPath === '/meeting/recordings';
          },
        },
        {
          path: '/meeting/rencents',
          label: i18n.getString('rencents', currentLocale),
          isActive() {
            return currentPath === '/meeting/rencents';
          },
        },
      ],
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
        showTabs
      />
    );
  }
}

function mapToProps(_, { phone, phone: { locale, routerInteraction } }) {
  return {
    currentLocale: locale.currentLocale,
    showSpinner: !locale.ready,
    currentPath: routerInteraction.currentPath,
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
  )(TabContentView),
);

export { mapToProps, mapToFunctions, MeetingTabContainer as default };
