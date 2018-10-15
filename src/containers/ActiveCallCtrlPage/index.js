/**
 * @file simplify active call control page
 * detail: https://jira.ringcentral.com/browse/RCINT-8256
 */

import { connect } from 'react-redux';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import formatNumber from 'ringcentral-integration/lib/formatNumber';
import callDirections from 'ringcentral-integration/enums/callDirections';
import withPhone from 'ringcentral-widgets/lib/withPhone';

import CallCtrlPanel from 'ringcentral-widgets/components/CallCtrlPanel';
import callCtrlLayouts from 'ringcentral-widgets/enums/callCtrlLayouts';
import { ACTIONS_CTRL_MAP } from 'ringcentral-widgets/components/ActiveCallPad';
import i18n from 'ringcentral-widgets/containers/SimpleActiveCallCtrlPage/i18n';
import { pickEleByProps } from 'ringcentral-widgets/containers/SimpleActiveCallCtrlPage/utils';

function mapToProps(_, {
  phone: {
    activeCallControl,
    regionSettings,
    callMonitor,
    locale,
  },
}) {
  const { activeSession, activeSessionId: sessionId } = activeCallControl;
  const activeCall = pickEleByProps(
    { sessionId: String(sessionId) },
    callMonitor.otherDeviceCalls
  )[0];
  let nameMatches;
  if (activeCall) {
    nameMatches =
      activeSession.direction === callDirections.outbound ?
        activeCall.toMatches : activeCall.fromMatches;
  }
  return {
    currentLocale: locale.currentLocale,
    session: activeSession,
    activeCall,
    sessionId: activeCallControl.activeSessionId,
    areaCode: regionSettings.areaCode,
    countryCode: regionSettings.countryCode,
    otherDeviceCalls: callMonitor.otherDeviceCalls,
    nameMatches,
    activeCallControl,
  };
}

function mapToFunctions(_, {
  phone: {
    routerInteraction,
  },
}) {
  return {
    onBackButtonClick: () => routerInteraction.goBack(),
  };
}

class ActiveCallControl extends Component {
  constructor(props) {
    super(props);

    this.onMute = () => this.props.activeCallControl.mute(this.props.sessionId);
    this.onUnmute = () => this.props.activeCallControl.unmute(this.props.sessionId);
    this.onHold = () => this.props.activeCallControl.hold(this.props.sessionId);
    this.onUnhold = () => this.props.activeCallControl.unHold(this.props.sessionId);
    this.onHangup = () => this.props.activeCallControl.hangUp(this.props.sessionId);
    this.onTransfer = async number =>
      this.props.activeCallControl.transfer(number, this.props.sessionId);

    this.formatPhone = phoneNumber => formatNumber({
      phoneNumber,
      areaCode: this.props.areaCode,
      countryCode: this.props.countryCode,
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.session) {
      this.props.onBackButtonClick();
    }
  }

  render() {
    const {
      currentLocale,
      session,
      onBackButtonClick,
      areaCode,
      countryCode,
      activeCall,
      nameMatches,
    } = this.props;
    if (!session) {
      return null;
    }
    const phoneNumber = session.direction === callDirections.outbound ?
      session.to : session.from;
    const { muteCtrl, transferCtrl, holdCtrl } = ACTIONS_CTRL_MAP;
    const props = {
      fallBackName: i18n.getString('Unknown', this.props.currentLocale),
      currentLocale,
      phoneNumber,
      onMute: this.onMute,
      onUnmute: this.onUnmute,
      onHold: this.onHold,
      onUnhold: this.onUnhold,
      onHangup: this.onHangup,
      onTransfer: this.onTransfer,
      showBackButton: true,
      backButtonLabel: i18n.getString('allCalls', currentLocale),
      onBackButtonClick,
      formatPhone: this.formatPhone,
      areaCode,
      countryCode,
      selectedMatcherIndex: 0,
      layout: callCtrlLayouts.normalCtrl,
      startTime: activeCall.startTime,
      actions: [muteCtrl, transferCtrl, holdCtrl],
      isOnMute: session.isOnMute,
      isOnHold: session.isOnHold,
      nameMatches,
      onSelectMatcherName: () => null,
      searchContactList: [],
      searchContact: () => [],
      recordStatus: '',
      onRecord: () => null,
      onStopRecord: () => null,
      onAdd: () => null,
      onMerge: () => null,
      onFlip: () => null,
      onPark: () => null,
      onKeyPadChange: () => null,
    };

    return <CallCtrlPanel {...props} />;
  }
}

ActiveCallControl.propTypes = {
  currentLocale: PropTypes.string,
  sessionId: PropTypes.string,
  areaCode: PropTypes.string.isRequired,
  countryCode: PropTypes.string.isRequired,
  session: PropTypes.object,
  activeCall: PropTypes.object,
  onBackButtonClick: PropTypes.func.isRequired,
  activeCallControl: PropTypes.object,
  nameMatches: PropTypes.array,
};

ActiveCallControl.defaultProps = {
  currentLocale: 'en-US',
  activeCallControl: {},
  session: null,
  sessionId: null,
  activeCall: {},
  nameMatches: [],
};

export default withPhone(connect(mapToProps, mapToFunctions)(ActiveCallControl));
