import React, { useState, useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';

import { RcDialog, styled } from '@ringcentral/juno';
import {
  Forwarding,
  Sms,
  Ignore,
  Voicemail,
  Phone,
  EndAnswer,
  HoldAnswer,
} from '@ringcentral/juno-icon';

import ReplyWithMessage from '@ringcentral-integration/widgets/components/ReplyWithMessage';
import i18n from '@ringcentral-integration/widgets/components/IncomingCallPad/i18n';

import CallCtrlButton from '../CallCtrlButton';
import ForwardForm from '../ForwardForm';

const StyledContainer = styled.div`
  margin-left: 10%;
  margin-right: 10%;
  padding-bottom: 30px;
  display: flex;
  flex-direction: column;
`;

const StyledButtonRow = styled.div`
  width: 100%;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-around;
`;

const StyledCtrlButton = styled(CallCtrlButton)`
  width: 22%;
  padding-top: 22%;
`;

const TwoButtonRow = styled(StyledButtonRow)`
  justify-content: space-evenly;
`;

type IncomingCallPadProps = {
  answer: (...args: any[]) => any;
  reject: (...args: any[]) => any;
  toVoiceMail: (...args: any[]) => any;
  currentLocale: string;
  forwardingNumbers: any[];
  formatPhone?: (...args: any[]) => any;
  onForward: (...args: any[]) => any;
  replyWithMessage: (...args: any[]) => any;
  className?: string;
  answerAndEnd?: (...args: any[]) => any;
  answerAndHold?: (...args: any[]) => any;
  hasOtherActiveCall?: boolean;
  sessionId: string;
  searchContactList: any[];
  searchContact: (...args: any[]) => any;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  getPresence?: (...args: any[]) => any;
};

const IncomingCallPad: FunctionComponent<IncomingCallPadProps> = ({
  currentLocale,
  sessionId,
  reject,
  answer,
  forwardingNumbers,
  formatPhone = (phone: any) => phone,
  className = null,
  hasOtherActiveCall = false,
  answerAndEnd = () => null,
  answerAndHold = () => null,
  getPresence = undefined,
  toVoiceMail,
  onForward,
  searchContact,
  searchContactList,
  phoneTypeRenderer = undefined,
  phoneSourceNameRenderer = undefined,
  replyWithMessage,
}) => {
  const [showForward, setShowForward] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);
  const [showReplyWithMessage, setShowReplyWithMessage] = useState(false);
  const [toVoiceMailEnabled, setToVoiceMailEnabled] = useState(true);
  const [replyMessageEnabled, setReplyMessageEnabled] = useState(true);
  const voicemailTimeout = useRef(null);
  const replyTimeout = useRef(null);

  useEffect(() => {
    if (replyTimeout.current) {
      clearTimeout(replyTimeout.current);
      replyTimeout.current = null;
    }
    if (voicemailTimeout.current) {
      clearTimeout(voicemailTimeout.current);
      voicemailTimeout.current = null;
    }
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (replyTimeout.current) {
        clearTimeout(replyTimeout.current);
        replyTimeout.current = null;
      }
      if (voicemailTimeout.current) {
        clearTimeout(voicemailTimeout.current);
        voicemailTimeout.current = null;
      }
    }
  } , []);
  const onToVoicemail = () => {
    if (typeof toVoiceMail === 'function') {
      toVoiceMail();
      setToVoiceMailEnabled(false);
      voicemailTimeout.current = setTimeout(() => {
        reject();
      }, 3000);
    }
  };
  const multiCallButtons = (
    <StyledButtonRow>
      <StyledCtrlButton
        icon={EndAnswer}
        onClick={answerAndEnd}
        title={i18n.getString('answerAndEnd', currentLocale)}
        dataSign="answerAndEnd"
      />
      <StyledCtrlButton
        icon={Voicemail}
        onClick={onToVoicemail}
        title={i18n.getString('toVoicemail', currentLocale)}
        dataSign="toVoiceMail"
        disabled={!toVoiceMailEnabled}
        color="danger.b04"
      />
      <StyledCtrlButton
        icon={HoldAnswer}
        onClick={answerAndHold}
        title={i18n.getString('answerAndHold', currentLocale)}
        dataSign="answerAndHold"
      />
    </StyledButtonRow>
  );
  const singleCallButtons = (
    <TwoButtonRow>
      <StyledCtrlButton
        icon={Voicemail}
        onClick={onToVoicemail}
        title={i18n.getString('toVoicemail', currentLocale)}
        dataSign="toVoiceMail"
        disabled={!toVoiceMailEnabled}
        color="danger.b04"
      />
      <StyledCtrlButton
        icon={Phone}
        onClick={answer}
        title={i18n.getString('answer', currentLocale)}
        dataSign="answer"
        color="success.b04"
      />
    </TwoButtonRow>
  );
  return (
    <StyledContainer>
      <StyledButtonRow>
        <StyledCtrlButton
          icon={Forwarding}
          onClick={() => {
            setShowForward(true);
          }}
          title={i18n.getString('forward', currentLocale)}
          dataSign="forward"
        />
        <StyledCtrlButton
          icon={Sms}
          onClick={() => {
            setShowReplyWithMessage(true);
          }}
          title={i18n.getString('reply', currentLocale)}
          dataSign="reply"
        />
        <StyledCtrlButton
          icon={Ignore}
          onClick={reject}
          title={i18n.getString('ignore', currentLocale)}
          dataSign="ignore"
        />
      </StyledButtonRow>
      {hasOtherActiveCall ? multiCallButtons : singleCallButtons}
      {
        showForward && (
          <ForwardForm
            forwardingNumbers={forwardingNumbers}
            currentLocale={currentLocale}
            onCancel={() => {
              setShowForward(false);
            }}
            open={showForward}
            formatPhone={formatPhone}
            onForward={onForward}
            searchContact={searchContact}
            searchContactList={searchContactList}
            phoneTypeRenderer={phoneTypeRenderer}
            phoneSourceNameRenderer={phoneSourceNameRenderer}
            getPresence={getPresence}
          />
        )
      }
      {
        showReplyWithMessage && (
          <RcDialog
            open={showReplyWithMessage}
            onClose={() => {
              setShowReplyWithMessage(false);
            }}
          >
            <ReplyWithMessage
              currentLocale={currentLocale}
              onCancel={() => {
                setShowReplyWithMessage(false);
              }}
              value={replyMessage}
              onChange={(message) => {
                setReplyMessage(message);
              }}
              onReply={(value) => {
                if (typeof replyWithMessage === 'function') {
                  replyWithMessage(value);
                  setReplyMessageEnabled(false);
                  replyTimeout.current = setTimeout(() => {
                    reject();
                  }, 3000);
                }
              }}
              disabled={!replyMessageEnabled}
            />
          </RcDialog>
        )
      }
    </StyledContainer>
  );
}

export default IncomingCallPad;
