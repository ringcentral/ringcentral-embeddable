import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from 'ringcentral-widgets/components/Environment/styles.scss';

import BackHeader from 'ringcentral-widgets/components/BackHeader';
import Panel from 'ringcentral-widgets/components/Panel';
import Line from 'ringcentral-widgets/components/Line';
import IconLine from 'ringcentral-widgets/components/IconLine';
import TextInput from 'ringcentral-widgets/components/TextInput';
import Switch from 'ringcentral-widgets/components/Switch';
import Button from 'ringcentral-widgets/components/Button';

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
    const hasChanges = !(
      this.state.serverValue === this.props.server &&
      this.state.enabledValue === this.props.enabled &&
      this.state.appKeyValue === this.props.appKey &&
      this.state.appSecretValue === this.props.appSecret
    );
    return (
      <div className={styles.root}>
        <BackHeader
          onBackClick={this.onCancel}
        >
          Environment
        </BackHeader>
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
              value={this.props.redirectUri}
              disabled
            />
          </Line>
          <Line>
            <Button
              className={classnames(styles.saveButton, !hasChanges ? styles.disabled : null)}
              onClick={this.onOk}
              disabled={!hasChanges}
            >
              Save
            </Button>
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
  redirectUri: PropTypes.string,
};

Environment.defaultProps = {
  appKey: null,
  appSecret: null,
  redirectUri: '',
};

export default Environment;
