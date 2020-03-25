import React, { Component } from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

import withPhone from 'ringcentral-widgets/lib/withPhone';
import TabContentPanel from 'ringcentral-widgets/components/TabContentPanel';
import SpinnerOverlay from 'ringcentral-widgets/components/SpinnerOverlay';
import i18n from './i18n';
import styles from './styles.scss';

interface MeetingTabContentViewProps {
  showSpinner: boolean,
  currentLocale: string,
  currentPath: string,
  goTo: (args: any) => any,
}

class TabContentView extends Component {
  constructor(props: MeetingTabContentViewProps) {
    super(props);
    this.getTabs = createSelector(
      () => this.props.currentLocale,
      () => this.props.currentPath,
      (currentLocale, currentPath) => [
        {
          path: '/meeting/home',
          label: i18n.getString('home', currentLocale),
          isActive() {
            return currentPath === '/meeting/home';
          },
        },
        {
          path: '/meeting/history',
          label: i18n.getString('rencents', currentLocale),
          isActive() {
            return currentPath === '/meeting/history';
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
