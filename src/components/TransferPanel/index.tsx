import React, { useState, useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';
import {
  RcDialPad,
  RcDialerPadSoundsMPEG,
  styled,
} from '@ringcentral/juno';
import { Askfirst, TransferCall } from '@ringcentral/juno-icon';

import i18n from '@ringcentral-integration/widgets/components/TransferPanel/i18n';

import { StyledRecipientsInput as RecipientsInput } from '../DialerPanel/StyledRecipientsInput';
import { BackHeaderView } from '../BackHeaderView';
import { CallButton } from './CallButton';

type TransferPanelProps = {
  setActiveSessionId?: (...args: any[]) => any;
  onTransfer: (...args: any[]) => any;
  onWarmTransfer: (...args: any[]) => any;
  currentLocale: string;
  onBack: (...args: any[]) => any;
  onCallEnd: (...args: any[]) => any;
  searchContactList?: any[];
  searchContact: (...args: any[]) => any;
  formatPhone: (...args: any[]) => any;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  recipientsContactInfoRenderer?: (...args: any[]) => any;
  recipientsContactPhoneRenderer?: (...args: any[]) => any;
  autoFocus?: boolean;
  sessionId: string;
  session?: object | null;
  controlBusy?: boolean;
  enableWarmTransfer?: boolean;
  getPresence?: (...args: any[]) => any;
};

const StyledPadContainer = styled.div`
  margin: 20px 10%;
`;

const StyledButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;


const StyledRecipientsInput = styled(RecipientsInput)`
  margin-top: 20px;
`;

const TransferPanel: FunctionComponent<TransferPanelProps> = ({
  setActiveSessionId = null,
  phoneTypeRenderer = undefined,
  phoneSourceNameRenderer = undefined,
  recipientsContactInfoRenderer =  undefined,
  recipientsContactPhoneRenderer =  undefined,
  autoFocus = true,
  session = null,
  searchContactList = [],
  controlBusy = false,
  enableWarmTransfer = false,
  children = null,
  onTransfer,
  onWarmTransfer,
  currentLocale,
  onBack,
  onCallEnd,
  searchContact,
  formatPhone,
  sessionId,
  getPresence,
}) => {
  const [toNumber, setToNumber] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [isLastInputFromDialpad, setIsLastInputFromDialpad] = useState(false);
  const sessionRef = useRef(session);

  useEffect(() => {
    setActiveSessionId(sessionId);
  }, [sessionId]);

  useEffect(() => {
    if (sessionRef.current && !session) {
      onCallEnd();
    }
    sessionRef.current = session;
  }, [session])

  if (!session) {
    return null;
  }

  const isOnTransfer = !!session.isOnTransfer;
  const transferButton = (
    <CallButton
      dataSign="transferBtn"
      onClick={() => {
        onTransfer(recipient?.phoneNumber || toNumber, sessionId)
      }}
      symbol={TransferCall}
      disabled={isOnTransfer || controlBusy || !(recipient?.phoneNumber || toNumber)}
      title={i18n.getString('blindTransfer', currentLocale)}
    />
  );
  let warmTransferButton;
  if (enableWarmTransfer) {
    warmTransferButton = (
      <CallButton
        dataSign="warnTransferBtn"
        onClick={() => {
          onWarmTransfer(recipient?.phoneNumber || toNumber, sessionId)
        }}
        symbol={Askfirst}
        disabled={isOnTransfer || controlBusy || !(recipient?.phoneNumber || toNumber)}
        title={i18n.getString('warmTransfer', currentLocale)}
      />
    );
  }
  return (
    <BackHeaderView
      title={i18n.getString('transferTo', currentLocale)}
      onBack={onBack}
    >
      <StyledRecipientsInput
        value={toNumber}
        onChange={(value) => {
          setIsLastInputFromDialpad(false);
          setToNumber(value);
        }}
        onClean={() => {
          setToNumber('');
        }}
        recipient={recipient}
        addToRecipients={(newRecipient) => {
          setRecipient(newRecipient);
          setToNumber('');
        }}
        removeFromRecipients={() => {
          setRecipient(null);
        }}
        searchContact={searchContact}
        searchContactList={searchContactList}
        formatContactPhone={formatPhone}
        currentLocale={currentLocale}
        phoneTypeRenderer={phoneTypeRenderer}
        phoneSourceNameRenderer={phoneSourceNameRenderer}
        contactInfoRenderer={recipientsContactInfoRenderer}
        contactPhoneRenderer={recipientsContactPhoneRenderer}
        isLastInputFromDialpad={isLastInputFromDialpad}
        titleEnabled
        autoFocus={autoFocus}
        getPresence={getPresence}
      />
      <StyledPadContainer>
        <RcDialPad
          data-sign="transfer"
          sounds={RcDialerPadSoundsMPEG}
          getDialPadButtonProps={(v) => ({
            'data-test-id': `${v}`,
            'data-sign': `dialPadBtn${v}`,
          })}
          onChange={(key) => {
            setIsLastInputFromDialpad(true);
            if (recipient) {
              return;
            }
            setToNumber(toNumber + key);
          }}
        />
      </StyledPadContainer>
      <StyledButtonRow>
        {warmTransferButton}
        {transferButton}
      </StyledButtonRow>
      {children}
    </BackHeaderView>
  );
}

export default TransferPanel;
