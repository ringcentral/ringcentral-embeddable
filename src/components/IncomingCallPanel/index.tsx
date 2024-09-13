import type { FunctionComponent } from 'react';
import React, { memo } from 'react';

import {
  RcDialog,
  RcIconButton,
  RcText,
  RcTypography,
  RcAvatar,
  RcIcon,
  styled,
  palette2,
  useAvatarShortName,
} from '@ringcentral/juno';
import { Previous, People } from '@ringcentral/juno-icon';

import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import i18n from '@ringcentral-integration/widgets/components/IncomingCallView/i18n';

import IncomingCallPad from '../IncomingCallPad';

const BackButton = styled(RcIconButton)`
  position: absolute;
  left: 6px;
  top: 6px;
`;

const StyledDialog = styled(RcDialog)`
  .MuiDialog-paperFullScreen {
    display: flex;
    flex-direction: column;
  }
`;

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
`;

const StyledUserInfo = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AvatarWrapper = styled.div`
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${palette2('avatar', 'global')};
  margin-bottom: 20px;
  width: 100%;

  .RcAvatar-avatarContainer {
    color: ${palette2('avatar', 'global')};
    background-color: ${palette2('neutral', 'b01')};
  }
`;

const DefaultAvatar = styled(RcIcon)`
  font-size: 3rem;
`;

const PhoneNumber = styled(RcText)`
  margin: 10px 0;
`;

const ToPhoneNumber = styled(RcText)`
  font-size: 0.813rem;
  margin-bottom: 10px;
`;

const UserNameContainer = styled(RcTypography)`
  line-height: 28px;
  color: ${palette2('neutral', 'f06')};
  text-align: center;

  .ContactDisplay_root {
    display: inline-block;
    > div {
      font-size: 1.25rem;
      color: ${palette2('neutral', 'f06')};
      line-height: 28px;
      display: inline;
    }

    .RcButton-text {
      .MuiButton-label {
        > div {
          font-size: 1.25rem;
          color: ${palette2('neutral', 'f06')};
          line-height: 28px;
        }
      }
    }
  }
`;

function getNames(name) {
  if (!name || name.length === 0) {
    return {};
  }
  const names = name.split(' ');
  if (names.length === 1) {
    return {
      firstName: names[0],
    };
  }
  return {
    firstName: names[0],
    lastName: names[names.length - 1] || '',
  };
}

type AvatarProps = {
  avatarUrl: string;
  name: string;
  nameMatches: any[];
  selectedMatcherIndex: number;
};
const Avatar: FunctionComponent<AvatarProps> = ({
  avatarUrl,
  name,
  nameMatches,
  selectedMatcherIndex
}) => {
  let nameMatch = null;
  if (nameMatches && nameMatches.length > 0) {
    if (nameMatches.length === 1) {
      nameMatch = nameMatches[0];
    } else if (selectedMatcherIndex > -1) {
      nameMatch = nameMatches[selectedMatcherIndex];
    }
  }
  let firstName = '';
  let lastName = '';
  if (nameMatch) {
    firstName = nameMatch.firstName;
    lastName = nameMatch.lastName;
    if (!firstName && nameMatch.name && nameMatch.name.length > 0) {
      const names = getNames(nameMatch.name);
      firstName = names.firstName;
      lastName = names.lastName;
    }
  }
  if (!firstName && name && name.length > 0) {
    const defaultNames = getNames(name);
    firstName = defaultNames.firstName;
    lastName = defaultNames.lastName;
  }
  const avatarName = useAvatarShortName({
    firstName,
    lastName,
  });
  return (
    <AvatarWrapper>
      <RcAvatar
        size="large"
        src={avatarUrl}
        color="avatar.global"
      >
        {
          avatarName ?
            avatarName : (
             <DefaultAvatar symbol={People} size="xxxlarge" />
            )
        }
      </RcAvatar>
    </AvatarWrapper>
  );
};

type CallInfoProps = {
  callQueueName: string;
  nameMatches: any[];
  phoneNumber: string;
  toPhoneNumber: string;
  fallBackName: string;
  currentLocale: string;
  areaCode: string;
  name: string;
  countryCode: string;
  selectedMatcherIndex: number;
  onSelectMatcherName: (...args: any[]) => any;
  brand: string;
  showContactDisplayPlaceholder: boolean;
  sourceIcons: any;
  phoneTypeRenderer: (...args: any[]) => any;
  phoneSourceNameRenderer: (...args: any[]) => any;
  formatPhone: (...args: any[]) => any;
};

const CallInfo: FunctionComponent<CallInfoProps> = ({
  callQueueName,
  nameMatches,
  phoneNumber,
  toPhoneNumber,
  fallBackName,
  currentLocale,
  areaCode,
  name,
  countryCode,
  selectedMatcherIndex,
  onSelectMatcherName,
  brand = 'RingCentral',
  showContactDisplayPlaceholder = true,
  sourceIcons,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  formatPhone,
}) => {
  return (
    <StyledUserInfo>
      <UserNameContainer component="div" variant="title1">
        {callQueueName}
        <ContactDisplay
          name={name}
          contactMatches={nameMatches}
          phoneNumber={phoneNumber}
          fallBackName={fallBackName || i18n.getString('unknown', currentLocale)}
          currentLocale={currentLocale}
          areaCode={areaCode}
          countryCode={countryCode}
          showType={false}
          selected={selectedMatcherIndex}
          onSelectContact={onSelectMatcherName}
          isLogging={false}
          enableContactFallback
          brand={brand}
          showPlaceholder={showContactDisplayPlaceholder}
          sourceIcons={sourceIcons}
          // @ts-expect-error TS(2322): Type '{ name: any; className: string; selectClassN... Remove this comment to see the full error message
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
        />
      </UserNameContainer>
      <PhoneNumber data-sign="userPhoneNumber">
        {formatPhone(phoneNumber)}
      </PhoneNumber>
      {
        toPhoneNumber && (
          <ToPhoneNumber data-sign="toPhoneNumber" color="neutral.f05">
            To:&nbsp;{formatPhone(toPhoneNumber)}
          </ToPhoneNumber>
        )
      }
    </StyledUserInfo>
  );
};

const IncomingCallPanel: FunctionComponent<any> = ({
  onBackButtonClick,
  phoneNumber,
  toPhoneNumber,
  callQueueName,
  currentLocale,
  formatPhone,
  nameMatches,
  fallBackName,
  areaCode,
  countryCode,
  selectedMatcherIndex,
  onSelectMatcherName,
  avatarUrl,
  brand = 'RingCentral',
  showContactDisplayPlaceholder,
  sourceIcons,
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  forwardingNumbers,
  answer,
  reject,
  toVoiceMail,
  replyWithMessage,
  onForward,
  hasOtherActiveCall,
  answerAndEnd,
  answerAndHold,
  sessionId,
  searchContact,
  searchContactList,
  children,
  name,
  getPresence,
}) => {
  return (
    <StyledDialog
      data-sign="IncomingCallPanel"
      open
      fullScreen
    >
      <Avatar
        avatarUrl={avatarUrl}
        name={name || fallBackName}
        nameMatches={nameMatches}
        selectedMatcherIndex={selectedMatcherIndex}
      />
      <Container>
        <CallInfo
          name={name}
          phoneNumber={phoneNumber}
          toPhoneNumber={toPhoneNumber}
          callQueueName={callQueueName}
          currentLocale={currentLocale}
          formatPhone={formatPhone}
          nameMatches={nameMatches}
          fallBackName={fallBackName}
          areaCode={areaCode}
          countryCode={countryCode}
          selectedMatcherIndex={selectedMatcherIndex}
          onSelectMatcherName={onSelectMatcherName}
          brand={brand}
          showContactDisplayPlaceholder={showContactDisplayPlaceholder}
          sourceIcons={sourceIcons}
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
        />
        <IncomingCallPad
          forwardingNumbers={forwardingNumbers}
          formatPhone={formatPhone}
          answer={answer}
          reject={reject}
          toVoiceMail={toVoiceMail}
          replyWithMessage={replyWithMessage}
          onForward={onForward}
          currentLocale={currentLocale}
          hasOtherActiveCall={hasOtherActiveCall}
          answerAndEnd={answerAndEnd}
          answerAndHold={answerAndHold}
          sessionId={sessionId}
          searchContact={searchContact}
          searchContactList={searchContactList}
          phoneTypeRenderer={phoneTypeRenderer}
          phoneSourceNameRenderer={phoneSourceNameRenderer}
          getPresence={getPresence}
        />
        {children}
      </Container>
      <BackButton
        symbol={Previous}
        onClick={onBackButtonClick}
        data-sign="backButton"
        color="neutral.f01"
      />
    </StyledDialog>
  );
};

export default memo(IncomingCallPanel);
