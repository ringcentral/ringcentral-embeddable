import 'rc-tooltip/assets/bootstrap_white.css';

import React, { useState, useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';

import classnames from 'classnames';
// @ts-expect-error TS(7016): Could not find a declaration file for module 'rc-t... Remove this comment to see the full error message
import Tooltip from 'rc-tooltip';

import AnswerIcon from '@ringcentral-integration/widgets/assets/images/Answer.svg';
import ForwardIcon from '@ringcentral-integration/widgets/assets/images/Forward.svg';
import IgnoreIcon from '@ringcentral-integration/widgets/assets/images/Ignore.svg';
import MessageIcon from '@ringcentral-integration/widgets/assets/images/MessageFill.svg';
import VoicemailIcon from '@ringcentral-integration/widgets/assets/images/Voicemail.svg';
import ActiveCallButton from '@ringcentral-integration/widgets/components/ActiveCallButton';
import MultiCallAnswerButton from '@ringcentral-integration/widgets/components/MultiCallAnswerButton';
import ReplyWithMessage from '@ringcentral-integration/widgets/components/ReplyWithMessage';
import i18n from '@ringcentral-integration/widgets/components/IncomingCallPad/i18n';
import styles from '@ringcentral-integration/widgets/components/IncomingCallPad/styles.scss';

import ForwardForm from '../ForwardForm';

const TooltipCom = typeof Tooltip === 'function' ? Tooltip : Tooltip.default;
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
  const forwardContainer = useRef(null);
  const replyWithMessageContainer = useRef(null);
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
    <div
      className={classnames(styles.buttonRow, styles.multiCallsButtonGroup)}
    >
      <MultiCallAnswerButton
        onClick={answerAndEnd}
        title={i18n.getString('answerAndEnd', currentLocale)}
        dataSign="answerAndEnd"
        className={styles.callButton}
        isEndOtherCall
      />
      <ActiveCallButton
        onClick={onToVoicemail}
        title={i18n.getString('toVoicemail', currentLocale)}
        buttonClassName={
          toVoiceMailEnabled ? styles.voiceMailButton : ''
        }
        icon={VoicemailIcon}
        iconWidth={274}
        iconX={116}
        showBorder={!toVoiceMailEnabled}
        dataSign="toVoiceMail"
        className={styles.callButton}
        disabled={!toVoiceMailEnabled}
      />
      <MultiCallAnswerButton
        onClick={answerAndHold}
        title={i18n.getString('answerAndHold', currentLocale)}
        dataSign="answerAndHold"
        className={styles.callButton}
        isEndOtherCall={false}
      />
    </div>
  );
  const singleCallButtons = (
    <div className={classnames(styles.buttonRow, styles.answerButtonGroup)}>
      <ActiveCallButton
        onClick={onToVoicemail}
        title={i18n.getString('toVoicemail', currentLocale)}
        buttonClassName={
          toVoiceMailEnabled ? styles.voiceMailButton : ''
        }
        icon={VoicemailIcon}
        iconWidth={274}
        iconX={116}
        showBorder={!toVoiceMailEnabled}
        dataSign="toVoiceMail"
        className={styles.bigCallButton}
        disabled={!toVoiceMailEnabled}
      />
      <ActiveCallButton
        onClick={answer}
        title={i18n.getString('answer', currentLocale)}
        buttonClassName={styles.answerButton}
        icon={AnswerIcon}
        showBorder={false}
        dataSign="answer"
        className={styles.bigCallButton}
      />
    </div>
  );
  return (
    <div className={classnames(styles.root, className)}>
      <div
        className={styles.forwardContainner}
        ref={forwardContainer}
      />
      <div
        className={styles.replyWithMessageContainner}
        ref={replyWithMessageContainer}
      />
      <div className={styles.buttonRow}>
        <ActiveCallButton
          icon={ForwardIcon}
          iconWidth={250}
          iconX={125}
          onClick={() => {
            console.log('Show forward');
            setShowForward(true);
          }}
          title={i18n.getString('forward', currentLocale)}
          dataSign="forward"
          className={styles.callButton}
        />
        <TooltipCom
          defaultVisible={false}
          visible={showReplyWithMessage}
          onVisibleChange={(visible) => {
            setShowReplyWithMessage(visible);
          }}
          placement="top"
          trigger="click"
          arrowContent={<div className="rc-tooltip-arrow-inner" />}
          getTooltipContainer={() => replyWithMessageContainer.current}
          overlay={
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
          }
        >
          <ActiveCallButton
            onClick={() => null}
            icon={MessageIcon}
            title={i18n.getString('reply', currentLocale)}
            dataSign="reply"
            className={styles.callButton}
          />
        </TooltipCom>
        <ActiveCallButton
          onClick={reject}
          icon={IgnoreIcon}
          title={i18n.getString('ignore', currentLocale)}
          dataSign="ignore"
          className={styles.callButton}
        />
      </div>
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
    </div>
  );
}

export default IncomingCallPad;
