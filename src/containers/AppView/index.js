import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withPhone } from '@ringcentral-integration/widgets/lib/phoneContext';
import { EnvironmentPanel } from '../../components/EnvironmentPanel';

import styles from './styles.scss';

function AppView(props) {
  return (
    <div className={styles.root}>
      {props.children}
      <EnvironmentPanel
        server={props.server}
        enabled={props.enabled}
        clientId={props.clientId}
        clientSecret={props.clientSecret}
        onSetData={props.onSetData}
        redirectUri={props.redirectUri}
        recordingHost={''}
      />
    </div>
  );
}

AppView.propTypes = {
  children: PropTypes.node,
  server: PropTypes.string,
  appKey: PropTypes.string,
  appSecret: PropTypes.string,
  enabled: PropTypes.bool,
  onSetData: PropTypes.func,
  redirectUri: PropTypes.string.isRequired,
};

AppView.defaultProps = {
  children: null,
  server: null,
  appSecret: null,
  appKey: null,
  enabled: false,
  onSetData: undefined,
};

export default withPhone(connect((_, {
  phone: {
    locale,
    oAuth,
    environment,
  }
}) => ({
  currentLocale: locale.currentLocale,
  server: environment.server,
  clientId: environment.clientId,
  clientSecret: environment.clientSecret,
  enabled: environment.enabled,
  redirectUri: oAuth.redirectUri,
}), (_, {
  phone: {
    environment,
  },
}) => ({
  onSetData: (options) => {
    environment.setData(options);
  },
}))(AppView));
