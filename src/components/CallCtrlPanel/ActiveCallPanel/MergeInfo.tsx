import React, { useState, useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';

import calleeTypes from '@ringcentral-integration/commons/enums/calleeTypes';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import {
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcAvatar,
  RcIcon,
  RcText,
  styled,
  palette2,
} from '@ringcentral/juno';
import { People, Conference } from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/ActiveCallPanel/i18n';

const Container = styled(RcList)`
  width: 100%;
  max-width: 332px;
  margin-left: auto;
  margin-right: auto;
`;

const MergeItem = styled(RcListItem)`
  .RcListItemText-primary {
    display: flex;
    align-items: center;
    flex-direction: row;
  }

  .ContactDisplay_root {
    vertical-align: bottom;
    font-family: Lato, Helvetica, Arial, sans-serif;
    flex: 1;
    overflow: hidden;
  
    > div {
      font-size: 0.9375rem;
      font-weight: 400;
      line-height: 22px;
    }
  }
`;

const LastCallItem = styled(MergeItem)`
  &.RcListItem-gutters {
    padding-left: 24px;
    padding-right: 24px;
  }

  .MuiListItemText-primary {
    font-size: 0.875rem;
    color: ${palette2('neutral', 'f04')};
  }
`;

const LastCallStatus = styled(RcText)`
  font-size: 0.75rem;
  color: ${palette2('neutral', 'f04')};
`;

const CallDuration = styled(RcText)`
  font-size: 0.75rem;
  color: ${palette2('neutral', 'f06')};
`;

const EmptyUserInfo = styled.div`
  display: block;
  text-align: center;
  padding-bottom: 15px;
  margin-left: auto;
  margin-right: auto;
  box-sizing: border-box;
  height: 134px;
`;

type MergeInfoProps = {
  currentLocale: string;
  timeCounter: JSX.Element;
  lastCallInfo?: object;
  currentCallTitle?: string;
  currentCallAvatarUrl?: string;
  formatPhone?: (...args: any[]) => any;
  getAvatarUrl?: (...args: any[]) => any;
  checkLastCallInfoTimeout?: number;
};

const MergeInfo: FunctionComponent<MergeInfoProps> = ({
  lastCallInfo = { calleeType: calleeTypes.unknown },
  getAvatarUrl = () => null,
  checkLastCallInfoTimeout = 30 * 1000,
  currentLocale,
  timeCounter,
  currentCallTitle = undefined,
  currentCallAvatarUrl = undefined,
  formatPhone = () => null,
}) => {
  const [lastCallAvatar, setLastCallAvatar] = useState(null);
  const [lastCallInfoTimeout, setLastCallInfoTimeout] = useState(false);
  const mounted = useRef(true);
  const timeoutClock = useRef(null);

  useEffect(() => {
    if (
      lastCallInfo &&
      // @ts-expect-error TS(2339): Property 'avatarUrl' does not exist on type 'objec... Remove this comment to see the full error message
      !lastCallInfo.avatarUrl &&
      // @ts-expect-error TS(2339): Property 'lastCallContact' does not exist on type ... Remove this comment to see the full error message
      lastCallInfo.lastCallContact
    ) {
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      getAvatarUrl(lastCallInfo.lastCallContact).then((newLastCallAvatar: string) => {
        if (mounted.current) {
          setLastCallAvatar(lastCallAvatar)
        }
      });
    }
    // @ts-expect-error TS(2339): Property 'calleeType' does not exist on type 'obje... Remove this comment to see the full error message
    if (lastCallInfo && lastCallInfo.calleeType !== calleeTypes.conference) {
      const isSimplifiedCallAndLastCallInfoNotReady =
        // @ts-expect-error TS(2339): Property 'name' does not exist on type 'object'.
        !lastCallInfo.name || !lastCallInfo.phoneNumber;
      if (isSimplifiedCallAndLastCallInfoNotReady) {
        timeoutClock.current = setTimeout(() => {
          if (mounted.current) {
            setLastCallInfoTimeout(true);
          }
        }, checkLastCallInfoTimeout);
      } else if (timeoutClock.current) {
        clearTimeout(timeoutClock.current);
        timeoutClock.current = null;
      }
    }
    return () => {
      mounted.current = false;
      if (timeoutClock.current) {
        clearTimeout(timeoutClock.current);
      }
    };
  }, []);

  if (!lastCallInfo) {
    return <EmptyUserInfo />;
  }
  const isLastCallInfoReady =
    // @ts-expect-error TS(2339): Property 'name' does not exist on type 'object'.
    !!lastCallInfo && (!!lastCallInfo.name || !!lastCallInfo.phoneNumber);
  const isLastCallEnded =
    // @ts-expect-error TS(2339): Property 'status' does not exist on type 'object'.
    lastCallInfo && lastCallInfo.status === sessionStatus.finished;
  const isOnConferenceCall = !!(
    // @ts-expect-error TS(2339): Property 'calleeType' does not exist on type 'obje... Remove this comment to see the full error message
    (lastCallInfo && lastCallInfo.calleeType === calleeTypes.conference)
  );
  const isContacts = !!(
    // @ts-expect-error TS(2339): Property 'calleeType' does not exist on type 'obje... Remove this comment to see the full error message
    (lastCallInfo && lastCallInfo.calleeType === calleeTypes.contacts)
  );
  const calleeName = isContacts
    ? // @ts-expect-error TS(2339): Property 'name' does not exist on type 'object'.
      lastCallInfo.name
    : // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      formatPhone(lastCallInfo.phoneNumber);
  const loadingText = i18n.getString('loading');
  const loadingTimeoutText = i18n.getString('loadingTimeout');
  const showSpinner =
    !lastCallInfoTimeout && !isLastCallInfoReady && !isOnConferenceCall;
  
  const firstCalleeAvatarUrl = isContacts && !lastCallInfo.avatarUrl
    ? lastCallAvatar
    : lastCallInfo.avatarUrl;
  return (
    <Container data-sign="mergeInfo">
      <LastCallItem
        canHover={false}
        disableTouchRipple
      >
        <RcListItemAvatar>
          <RcAvatar
            size="xsmall"
            src={firstCalleeAvatarUrl}
            data-sign="avatar"
            color="avatar.global"
          >
            {
              firstCalleeAvatarUrl ? null : (
                <RcIcon
                  symbol={isOnConferenceCall ? Conference : People}
                  size="small"
                />
              )
            }
          </RcAvatar>
        </RcListItemAvatar>
        {
          (isLastCallInfoReady || (!isLastCallInfoReady && isOnConferenceCall)) && (
            <RcListItemText
              primary={
                isOnConferenceCall ? i18n.getString('conferenceCall', currentLocale) : calleeName
              }
            />
          )
        }
        {
          !isLastCallInfoReady && !isOnConferenceCall && (
          lastCallInfoTimeout ? (
            <RcListItemText
              primary={loadingTimeoutText}
              primaryTypographyProps={{
                color: 'neutral.f04',
              }}
            />
          ) : (
            <RcListItemText
              primary={loadingText}
            />
          ))
        }
        <RcListItemSecondaryAction>
          {
            (isLastCallInfoReady || (!isLastCallInfoReady && isOnConferenceCall)) && (
              <LastCallStatus variant="body1">
                {/* @ts-expect-error TS(2339): Property 'status' does not exist on */}
                {lastCallInfo.status === sessionStatus.finished
                  ? i18n.getString('disconnected', currentLocale)
                  : i18n.getString('onHold', currentLocale)}
              </LastCallStatus>
            )
          }
        </RcListItemSecondaryAction>
      </LastCallItem>
      <MergeItem
        canHover={false}
        disableTouchRipple
      >
        <RcListItemAvatar>
          <RcAvatar
            size="small"
            src={currentCallAvatarUrl}
            data-sign="avatar"
            color="avatar.lake"
          >
            {
              currentCallAvatarUrl ? null : (
                <RcIcon
                  symbol={People}
                  size="small"
                />
              )
            }
          </RcAvatar>
        </RcListItemAvatar>
        <RcListItemText
          primary={currentCallTitle}
          data-sign="activeCalleeName"
        />
        <RcListItemSecondaryAction>
          <CallDuration variant="body1">
            {timeCounter}
          </CallDuration>
        </RcListItemSecondaryAction>
      </MergeItem>
    </Container>
  );
};

export default MergeInfo;