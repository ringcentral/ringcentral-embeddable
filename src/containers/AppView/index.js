import React from 'react';

import classnames from 'classnames';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withPhone } from '@ringcentral-integration/widgets/lib/phoneContext';
import {
  RcAlert,
  RcIcon,
  RcLink,
} from '@ringcentral/juno';
import { InfoBorder } from '@ringcentral/juno-icon';
import { styled } from '@ringcentral/juno/foundation';

import { EnvironmentPanel } from '../../components/EnvironmentPanel';
import styles from './styles.scss';

const DemoOnlyWarning = styled(RcAlert)`
  padding: 2px 16px 2px 42px!important;

  .RcAlert-message {
    font-size: 14px !important;
    line-height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;

    a {
      line-height: 16px;
      height: 16px;
      color: inherit;
    }

    .MuiAlert-action {
      padding-left: 0;
    }
  }
`;

function AppView(props) {
  return (
    <div
      className={classnames(styles.root, props.showDemoWarning ? styles.demoWarning : null)}
    >
      {
        props.showDemoWarning ? (
          <DemoOnlyWarning
            severity="error"
            onClose={() => {
              props.dismissDemoWarning();
            }}
          >
            FOR DEMO PURPOSES ONLY &nbsp;
            <RcLink
              href="https://github.com/ringcentral/ringcentral-embeddable/blob/master/docs/config-client-id-and-secret.md"
              target='_blank'
            >
              <RcIcon
                symbol={InfoBorder}
                size="small"
              />
            </RcLink>
          </DemoOnlyWarning>
        ) : null
      }
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
    adapter,
  },
}) => ({
  currentLocale: locale.currentLocale,
  server: environment.server,
  clientId: environment.clientId,
  clientSecret: environment.clientSecret,
  enabled: environment.enabled,
  redirectUri: oAuth.redirectUri,
  showDemoWarning: adapter.showDemoWarning,
}), (_, {
  phone: {
    environment,
    adapter,
  },
}) => ({
  onSetData: (options) => {
    environment.setData(options);
  },
  dismissDemoWarning: () => {
    adapter.dismissDemoWarning();
  },
}))(AppView));
