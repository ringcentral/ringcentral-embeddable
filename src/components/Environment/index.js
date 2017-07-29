import React, { Component } from 'react';
import PropTypes from 'prop-types';
import styles from 'ringcentral-widget/components/Environment/styles.scss';

import Header from 'ringcentral-widget/components/Header';
import Panel from 'ringcentral-widget/components/Panel';
import Line from 'ringcentral-widget/components/Line';
import IconLine from 'ringcentral-widget/components/IconLine';
import TextInput from 'ringcentral-widget/components/TextInput';
import Switch from 'ringcentral-widget/components/Switch';

/**
 * Environment component for switching api server. Intended only for testing.
 * This component current does not comply to use redux properly.
 */

class Environment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hidden: true,
      serverValue: props.server,
      appKeyValue: props.appKey,
      appSecretValue: props.appSecret,
      enabledValue: props.enabled,
    };

    this.onServerChange = (e) => {
      this.setState({
        serverValue: e.currentTarget.value,
      });
    };
    this.onAppKeyChange = (e) => {
      this.setState({
        appKeyValue: e.currentTarget.value,
      });
    };
    this.onAppSecretChange = (e) => {
      this.setState({
        appSecretValue: e.currentTarget.value,
      });
    };
    this.onToggleEnabled = () => {
      this.setState({
        enabledValue: !this.state.enabledValue,
      });
    };
    this.onOk = () => {
      this.props.onSetData({
        server: this.state.serverValue,
        enabled: this.state.enabledValue,
        appKey: this.state.appKeyValue,
        appSecret: this.state.appSecretValue,
      });
      this.toggleEnv();
    };
    this.onCancel = () => {
      this.setState({
        serverValue: this.props.server,
        enabledValue: this.props.enabled,
        appKeyValue: this.props.appKey,
        appSecretValue: this.props.appSecret,
      });
      this.toggleEnv();
    };
    this.toggleEnv = () => {
      this.setState({
        hidden: !this.state.hidden,
      });
    };
    if (typeof window !== 'undefined') {
      window.toggleEnv = this.toggleEnv;
    }
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.server !== this.props.server) {
      this.setState({
        serverValue: nextProps.server,
      });
    }
    if (nextProps.enabled !== this.props.enabled) {
      this.setState({
        enabledValue: nextProps.enabled,
      });
    }
    if (nextProps.appKey !== this.props.appKey) {
      this.setState({
        appKeyValue: nextProps.appKey,
      });
    }
    if (nextProps.appSecret !== this.props.appSecret) {
      this.setState({
        appSecretValue: nextProps.appSecret,
      });
    }
  }
  render() {
    if (this.state.hidden) {
      return null;
    }
    return (
      <div className={styles.root}>
        <Header
          buttons={[
            {
              label: <i className="fa fa-times" />,
              onClick: this.onCancel,
            },
            {
              label: <i className="fa fa-save" />,
              onClick: this.onOk,
              disabled: (
                this.state.serverValue === this.props.server &&
                this.state.enabledValue === this.props.enabled &&
                this.state.appKeyValue === this.props.appKey &&
                this.state.appSecretValue === this.props.appSecret
              ),
              placement: 'right',
            },
          ]}
        >Environment</Header>
        <Panel classname={styles.content}>
          <Line>
            Server
            <TextInput
              value={this.state.serverValue}
              onChange={this.onServerChange}
            />
          </Line>
          <Line>
            App Key
            <TextInput
              value={this.state.appKeyValue}
              onChange={this.onAppKeyChange}
            />
          </Line>
          <Line>
            App Secret
            <TextInput
              value={this.state.appSecretValue}
              onChange={this.onAppSecretChange}
            />
          </Line>
          <IconLine
            icon={
              <Switch
                checked={this.state.enabledValue}
                onChange={this.onToggleEnabled}
              />
            }
          >
            Enable
          </IconLine>
          <Line>
            Redirect Url
            <TextInput
              value={`${this.props.hostingUrl}/redirect.html`}
              disabled
            />
          </Line>
        </Panel>
      </div>
    );
  }
}

Environment.propTypes = {
  appKey: PropTypes.string,
  appSecret: PropTypes.string,
  server: PropTypes.string.isRequired,
  enabled: PropTypes.bool.isRequired,
  onSetData: PropTypes.func.isRequired,
  hostingUrl: PropTypes.string,
};

Environment.defaultProps = {
  appKey: null,
  appSecret: null,
  hostingUrl: '',
};

export default Environment;
