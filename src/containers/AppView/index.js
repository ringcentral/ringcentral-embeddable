import React from 'react';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withPhone } from '@ringcentral-integration/widgets/lib/phoneContext';
import {
  RcAlert,
  RcLink,
} from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';

import { EnvironmentPanel } from '../../components/EnvironmentPanel';
import styles from './styles.scss';

const DemoOnlyWarning = styled(RcAlert)`
  padding: 8px 16px!important;

  .RcAlert-message {
    font-size: 12px !important;
    line-height: 1.3;
  }
`;

function AppView(props) {
  return (
    <div className={styles.root}>
      <DemoOnlyWarning
        severity="warning"
        action={
          
        }
      >
        This app is using demo only client ID, please refer
        <RcLink href="/test" target='_blank'>here</RcLink>
        for details.
      </DemoOnlyWarning>
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
