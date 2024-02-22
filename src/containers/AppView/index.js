import React from 'react';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { styled, palette2 } from '@ringcentral/juno/foundation';
import { withPhone } from '@ringcentral-integration/widgets/lib/phoneContext';

import { DemoOnlyBanner } from '../../components/DemoOnlyBanner';
import { EnvironmentPanel } from '../../components/EnvironmentPanel';
import './styles.scss';

const Root = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: ${palette2('neutral', 'b01')};
`;

const Content = styled.div`
  flex: 1;
  overflow: hidden;
`;

function AppView(props) {
  return (
    <Root>
      <DemoOnlyBanner
        show={props.showDemoWarning}
        onClose={props.dismissDemoWarning}
      />
      <Content>
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
      </Content>
    </Root>
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
