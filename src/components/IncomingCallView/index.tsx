import type { FunctionComponent } from 'react';
import React, { useEffect, useState, useRef } from 'react';

import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { useMountState } from '@ringcentral/juno/foundation/hooks';
import i18n from '@ringcentral-integration/widgets/components/IncomingCallView/i18n';

import IncomingCallPanel from '../IncomingCallPanel';

export type IncomingCallViewProps = {
  session: {
    id?: string;
    direction?: string;
    startTime?: number;
    isOnMute?: boolean;
    isOnHold?: boolean;
    isOnRecord?: boolean;
    to?: string;
    from?: string;
    fromUserName?: string;
    toUserName?: string;
    contactMatch?: object;
    minimized?: boolean;
    callQueueName?: any;
  };
  showCallQueueName?: any;
  currentLocale: string;
  toggleMinimized: (...args: any[]) => any;
  answer: (...args: any[]) => any;
  reject: (...args: any[]) => any;
  ignore: (...args: any[]) => any;
  onForward: (...args: any[]) => any;
  startReply: (...args: any[]) => any;
  toVoiceMail: (...args: any[]) => any;
  replyWithMessage: (...args: any[]) => any;
  formatPhone: (...args: any[]) => any;
  nameMatches: any[];
  areaCode: string;
  countryCode: string;
  getAvatarUrl: (...args: any[]) => any;
  forwardingNumbers: any[];
  updateSessionMatchedContact: (...args: any[]) => any;
  showContactDisplayPlaceholder: boolean;
  brand: string;
  activeSessionId?: string;
  sourceIcons?: object;
  hangup: (...args: any[]) => any;
  onHold: (...args: any[]) => any;
  searchContactList: any[];
  searchContact: (...args: any[]) => any;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  phoneNumber: string;
  toPhoneNumber?: string;
  name: string;
  getPresence?: (...args: any[]) => any;
  container: Element;
};
export const IncomingCallView: FunctionComponent<IncomingCallViewProps> = (
  props,
) => {
  const {
    currentLocale,
    nameMatches = [],
    phoneNumber,
    toPhoneNumber,
    formatPhone,
    areaCode,
    countryCode,
    forwardingNumbers,
    brand,
    showContactDisplayPlaceholder,
    sourceIcons,
    searchContact,
    searchContactList,
    children,
    session,
    activeSessionId,
    showCallQueueName,
    reject: rejectProp,
    ignore: ignoreProp,
    toVoiceMail: toVoiceMailProp,
    replyWithMessage: replyWithMessageProp,
    toggleMinimized: toggleMinimizedProp,
    hangup: hangupProp,
    answer: answerProp,
    onHold: onHoldProp,
    onForward: onForwardProp,
    startReply: startReplyProp,
    getAvatarUrl,
    updateSessionMatchedContact,
    phoneTypeRenderer,
    phoneSourceNameRenderer,
    name,
    getPresence,
    container,
  } = props;
  const [selectedMatcherIndex, setSelectedMatcherIndex] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const sessionRef = useRef(null);

  const { current: mounted } = useMountState();

  const hasOtherActiveCall = !!activeSessionId;
  const answer = () => answerProp(session.id);
  const reject = () => rejectProp(session.id);
  const ignore = () => ignoreProp(session.id);
  const toVoiceMail = () => toVoiceMailProp(session.id);
  const replyWithMessage = (message: string) =>
    replyWithMessageProp(session.id, message);

  const toggleMinimized = () => toggleMinimizedProp(session.id);
  const answerAndEnd = async () => {
    await hangupProp(activeSessionId);
    await answerProp(session.id);
  };

  const answerAndHold = async () => {
    await onHoldProp(activeSessionId);
    await answerProp(session.id);
  };

  const onForward = (forwardNumber: string, recipient: any) =>
    onForwardProp(session.id, forwardNumber, recipient);

  const startReply = () => startReplyProp(session.id);

  const updateAvatarUrl = async (contact: any) => {
    avatarUrl && setAvatarUrl(null);

    if (contact) {
      const avatarUrl = await getAvatarUrl(contact);
      // prevent memory leak issue when component unmounted
      if (!mounted) return;

      setAvatarUrl(avatarUrl);
    }
  };

  const getSelectedMatcherItem = (currContact: any | undefined) => {
    let index = nameMatches.findIndex((match) => match.id === currContact?.id);

    if (index < 0) index = 0;

    if (index !== selectedMatcherIndex) {
      setSelectedMatcherIndex(index);
    }

    return nameMatches[index];
  };

  const handleSelectMatcherName = (currContact: any) => {
    const contact = getSelectedMatcherItem(currContact);

    if (contact) {
      updateAvatarUrl(contact);

      updateSessionMatchedContact(session.id, contact);
    }
  };

  useEffect(() => {
    if (sessionRef.current === session) {
      return;
    }
    if (!sessionRef.current && !session) {
      return;
    }
    if (!session) {
      sessionRef.current = session;
      return;
    }
    const oldSession = sessionRef.current;
    sessionRef.current = session;
    if (!oldSession || oldSession.id !== session.id) {
      sessionRef.current = session;
      const contact = getSelectedMatcherItem(
        session.contactMatch ||
          // zero index maybe null
          nameMatches?.[0],
      );
  
      updateAvatarUrl(contact);
      return;
    }
    if (!session.contactMatch) {
      return;
    }
    if (session.contactMatch?.id !== oldSession.contactMatch?.id) {
      const contact = getSelectedMatcherItem(session.contactMatch);
      updateAvatarUrl(contact);
    }
  }, [session]);

  const active = !!session.id;
  if (!active || session.minimized) {
    return null;
  }

  let fallbackUserName: string | undefined;
  if (
    session.direction === callDirections.inbound &&
    session.from === 'anonymous'
  ) {
    fallbackUserName = i18n.getString('anonymous', currentLocale);
  }
  if (!fallbackUserName) {
    fallbackUserName = session.direction === callDirections.inbound ? session.fromUserName : session.toUserName;
  }

  return (
    <IncomingCallPanel
      container={container}
      currentLocale={currentLocale}
      nameMatches={nameMatches}
      name={name}
      fallBackName={fallbackUserName}
      callQueueName={showCallQueueName ? session.callQueueName : null}
      phoneNumber={phoneNumber}
      toPhoneNumber={toPhoneNumber}
      answer={answer}
      reject={reject}
      ignore={ignore}
      replyWithMessage={replyWithMessage}
      toVoiceMail={toVoiceMail}
      formatPhone={formatPhone}
      areaCode={areaCode}
      countryCode={countryCode}
      selectedMatcherIndex={selectedMatcherIndex}
      onSelectMatcherName={handleSelectMatcherName}
      avatarUrl={avatarUrl}
      onBackButtonClick={toggleMinimized}
      forwardingNumbers={forwardingNumbers}
      onForward={onForward}
      startReply={startReply}
      brand={brand}
      showContactDisplayPlaceholder={showContactDisplayPlaceholder}
      hasOtherActiveCall={hasOtherActiveCall}
      answerAndEnd={answerAndEnd}
      answerAndHold={answerAndHold}
      sessionId={session.id}
      sourceIcons={sourceIcons}
      searchContact={searchContact}
      searchContactList={searchContactList}
      phoneTypeRenderer={phoneTypeRenderer}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      getPresence={getPresence}
    >
      {children}
    </IncomingCallPanel>
  );
};
