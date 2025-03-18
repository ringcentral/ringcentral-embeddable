import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';

import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';
import i18n from '@ringcentral-integration/widgets/components/SimpleCallControlPanel/i18n';
import type { SimpleCallControlPanelProps } from '@ringcentral-integration/widgets/components/SimpleCallControlPanel/SimpleCallControlPanel.interface';

import { ACTIONS_CTRL_MAP } from '../CallCtrlPanel/ActiveCallPad/actions';
import CallCtrlPanel from '../CallCtrlPanel';

type OtherDeviceCallCtrlPanelProps = SimpleCallControlPanelProps & {
  updateSessionMatchedContact: (...args: any[]) => any;
};

// TODO: move this function to utils
function getDefaultSelectedMatcherIndex(nameMatches, showContactDisplayPlaceholder) {

}

const OtherDeviceCallCtrlPanel: FunctionComponent<OtherDeviceCallCtrlPanelProps> =
  ({
    activeSession = null,
    areaCode,
    countryCode,
    nameMatches = [],
    sessionId = '',
    currentLocale = 'en-US',
    fallBackName = '',
    phoneNumber = '',
    actions = [
      ACTIONS_CTRL_MAP.muteCtrl,
      ACTIONS_CTRL_MAP.transferCtrl,
      ACTIONS_CTRL_MAP.holdCtrl,
    ],
    showContactDisplayPlaceholder = false,
    controlBusy = false,
    brandName,
    onBackButtonClick,
    setActiveSessionId = () => {},
    onMute,
    onUnmute,
    onHold,
    onUnhold,
    onHangup,
    onTransfer,
    maxExtensionNumberLength = 6,
    updateSessionMatchedContact,
  }) => {
    const [selectedMatcherIndex, setSelectedMatcherIndex] = useState(0);
    const formatPhone = useCallback(
      (phoneNumber) =>
        formatNumber({
          phoneNumber,
          areaCode,
          countryCode,
          maxExtensionLength: maxExtensionNumberLength,
        }),
      [areaCode, countryCode],
    );
    const onSelectMatcherName = useCallback(
      (option) => {
        let selectedMatcherIndex = (nameMatches ?? []).findIndex(
          (match) => match.id === option.id,
        );
        if (selectedMatcherIndex < 0) {
          selectedMatcherIndex = 0;
        }
        setSelectedMatcherIndex(selectedMatcherIndex);
        updateSessionMatchedContact(sessionId, option);
      },
      [nameMatches],
    );
    const renderTime = useRef(0);
    useEffect(() => {
      if (renderTime.current > 0 && !activeSession) {
        onBackButtonClick();
      }
      renderTime.current += 1;
    });
    useEffect(() => {
      setActiveSessionId(sessionId);
    }, []);
    if (!activeSession) {
      // or using skeleton screen here
      return null;
    }
    return (
      <CallCtrlPanel
        sessionId={sessionId}
        currentLocale={currentLocale}
        fallBackName={fallBackName}
        phoneNumber={phoneNumber}
        onMute={onMute}
        onUnmute={onUnmute}
        onHold={onHold}
        onUnhold={onUnhold}
        onHangup={onHangup}
        onTransfer={onTransfer}
        showBackButton
        backButtonLabel={i18n.getString('allCalls', currentLocale)}
        onBackButtonClick={onBackButtonClick}
        formatPhone={formatPhone}
        areaCode={areaCode}
        countryCode={countryCode}
        selectedMatcherIndex={selectedMatcherIndex}
        layout={callCtrlLayouts.normalCtrl}
        startTime={activeSession.startTime}
        actions={actions}
        isOnMute={activeSession.isOnMute}
        isOnHold={activeSession.isOnHold}
        nameMatches={nameMatches}
        onSelectMatcherName={onSelectMatcherName}
        brand={brandName}
        showContactDisplayPlaceholder={showContactDisplayPlaceholder}
        controlBusy={controlBusy}
      />
    );
  };

export { OtherDeviceCallCtrlPanel };
