import type { FunctionComponent } from 'react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

import classnames from 'classnames';

import { telephonySessionStatus } from '@ringcentral-integration/commons/enums/telephonySessionStatus';
import {
  isInbound,
  isRinging,
} from '@ringcentral-integration/commons/lib/callLogHelpers';
import { isHolding as isTelephonySessionOnHold } from '@ringcentral-integration/commons/modules/ActiveCallControl/helpers';
import sessionStatus from '@ringcentral-integration/commons/modules/Webphone/sessionStatus';
import { isOnHold as isOnHoldDefault } from '@ringcentral-integration/commons/modules/Webphone/webphoneHelper';

import i18n from '@ringcentral-integration/widgets/components/ActiveCallItem/i18n';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import DurationCounter from '@ringcentral-integration/widgets/components/DurationCounter';
import type { ActiveCallItemProps } from '@ringcentral-integration/widgets/components/ActiveCallItemV2/ActiveCallItem.interface';
import { RcListItemText, RcListItemAvatar } from '@ringcentral/juno';
import {
  Phone,
  PhoneOff,
  Hold,
  HoldAnswer,
  Ignore,
  Merge,
  Swap,
  TransferCall,
  Voicemail,
  NewAction,
  Edit,
  ViewLogBorder,
  People,
} from '@ringcentral/juno-icon'
import styles from '@ringcentral-integration/widgets/components/ActiveCallItemV2/styles.scss';
import { checkShouldHideContactUser } from '@ringcentral-integration/widgets/lib/checkShouldHideContactUser';
import { VOICEMAIL_DROP_STATUS_MAP } from '../../modules/WebphoneV2/voicemailDropStatus';
import {
  StyledListItem,
  StyledSecondary,
  DetailArea,
  StyledActionMenu,
} from '../CallItem/styled';
import { SwitchDialog } from './SwitchDialog';
import { CallIcon } from './CallIcon';

const getWebphoneActions = ({
  currentLocale,
  session = undefined,
  webphoneReject,
  webphoneHangup,
  webphoneResume,
  webphoneAnswer,
  webphoneHold,
  showMergeCall = false,
  showHold = true,
  disableMerge = true,
  onMergeCall = (i) => i,
  disableLinks = false,
  isOnHold,
  telephonySessionId,
  webphoneIgnore,
  showHoldAnswerBtn,
  showIgnoreBtn,
  isConnecting = false,
}) => {
  if (!session) {
    return [];
  }

  const actions: any[] = [];
  const isRinging = isInbound(session) && session.callStatus === sessionStatus.connecting;
  if (isRinging) {
    actions.push({
      icon: Voicemail,
      title: i18n.getString('toVoicemail', currentLocale),
      onClick: () => {
        webphoneReject(session.id, telephonySessionId);
      },
      disabled: disableLinks,
      color: 'danger.b04'
    });
    if (showIgnoreBtn) {
      actions.push({
        icon: Ignore,
        title: i18n.getString('ignore', currentLocale),
        onClick: () => {
          webphoneIgnore && webphoneIgnore(telephonySessionId);
        },
        disabled: disableLinks,
        color: 'neutral.b04'
      });
    }
    actions.push({
      icon: showHoldAnswerBtn ? HoldAnswer : Phone,
      title: i18n.getString(showHoldAnswerBtn ? 'holdAndAnswer' : 'accept', currentLocale),
      onClick: () => {
        webphoneAnswer(session.id, telephonySessionId, showHoldAnswerBtn);
      },
      disabled: disableLinks,
      color: 'success.b03'
    });
  } else {
    if (showHold) {
      if (isOnHold(session)) {
        actions.push({
          icon: Hold,
          title: i18n.getString('unhold', currentLocale),
          onClick: () => {
            webphoneResume(session.id, telephonySessionId);
          },
          disabled: disableLinks || isConnecting,
          color: 'action.primary',
        });
      } else {
        actions.push({
          icon: Hold,
          title: i18n.getString('hold', currentLocale),
          onClick: () => {
            webphoneHold(session.id, telephonySessionId);
          },
          disabled: disableLinks || isConnecting,
        });
      }
    }
    if (showMergeCall) {
      actions.push({
        icon: Merge,
        title: i18n.getString('mergeToConference', currentLocale),
        onClick: () => {
          onMergeCall(session.id, telephonySessionId);
        },
        disabled: disableMerge || disableLinks,
      });
    }
    actions.push({
      icon: PhoneOff,
      title: i18n.getString('hangup', currentLocale),
      onClick: () => {
        webphoneHangup(session.id, telephonySessionId);
      },
      disabled: disableLinks,
      color: 'danger.b04'
    });
  }
  return actions;
};

const getActiveCallControlActions = ({
  session = undefined,
  showRingoutCallControl,
  showSwitchCall,
  showTransferCall,
  showHoldOnOtherDevice,
  currentLocale,
  disableLinks = false,
  telephonySessionId,
  ringoutHangup,
  ringoutReject,
  ringoutTransfer = undefined,
  ringing,
  inbound,
  onClickSwitchBtn = undefined,
  webphoneResume = undefined,
  webphoneHold = undefined,
  isConnecting = false,
  clickSwitchTrack = () => {},
}) => {
  if (!showRingoutCallControl && !showSwitchCall) return [];
  const actions: any[] = [];
  const incomingCall = inbound && ringing;
  if (showRingoutCallControl) {
    if (!incomingCall) {
      const disabled = disableLinks || isConnecting || ringing;
      if (showHoldOnOtherDevice && session) {
        if (isTelephonySessionOnHold(session)) {
          actions.push({
            icon: Hold,
            title: i18n.getString('unhold', currentLocale),
            onClick: () => {
              webphoneResume && webphoneResume('', telephonySessionId);
            },
            disabled,
            color: 'action.primary',
          });
        } else {
          actions.push({
            icon: Hold,
            title: i18n.getString('hold', currentLocale),
            onClick: () => {
              webphoneHold && webphoneHold('', telephonySessionId);
            },
            disabled,
          });
        }
      }
      if (showTransferCall && ringoutTransfer) {
        actions.push({
          icon: TransferCall,
          title: i18n.getString('transfer', currentLocale),
          onClick: () => {
            ringoutTransfer(telephonySessionId);
          },
          disabled,
        });
      }
    }
  }

  if (showSwitchCall) {
    actions.push({
      icon: Swap,
      title: i18n.getString('switchCall', currentLocale),
      onClick: () => {
        clickSwitchTrack();
        onClickSwitchBtn && onClickSwitchBtn();
      },
      disabled: disableLinks || ringing,
      color: 'success.b03'
    });
  }

  if (showRingoutCallControl) {
    // end button
    if (incomingCall) {
      actions.push({
        icon: PhoneOff,
        title: i18n.getString('reject', currentLocale),
        onClick: () => {
          ringoutReject(telephonySessionId);
        },
        disabled: disableLinks,
        color: 'danger.b04',
      });
    } else {
      actions.push({
        icon: Phone,
        title: i18n.getString('hangup', currentLocale),
        onClick: () => {
          ringoutHangup(telephonySessionId);
        },
        disabled: disableLinks,
        color: 'danger.b04',
      });
    }
  }
  return actions;
};

function getContactMatches(call) {
  return isInbound(call) ? call.fromMatches : call.toMatches;
}

function getPhoneNumber(call) {
  return isInbound(call)
    ? call.from.phoneNumber || call.from.extensionNumber
    : call.to.phoneNumber || call.to.extensionNumber;
}

function getSelectedContactIdx(call, contactMatches) {
  let selected = 0;
  if (call.toNumberEntity && contactMatches && contactMatches.length) {
    selected = contactMatches.findIndex(
      (match) => match.id === call.toNumberEntity,
    );
    if (selected > -1) {
      return selected;
    }
  }
  if (!call.webphoneSession) {
    selected = 0;
  } else if (contactMatches && contactMatches.length) {
    const contact = call.webphoneSession.contactMatch;
    if (contact) {
      selected = contactMatches.findIndex((match) => match.id === contact.id);
    }
    if (selected === -1 || !contact) {
      selected = 0;
    }
  }
  return selected;
}

function getSessionContact(call, selected: number | undefined) {
  const contactMatches = getContactMatches(call);
  const idx = selected ?? getSelectedContactIdx(call, contactMatches);
  return contactMatches ? contactMatches[idx] : null;
}

function getFallbackContactName(call) {
  return isInbound(call)
    ? call.from.name
    : call.to.name;
}

interface newActiveCallItemProps extends ActiveCallItemProps {
  onSwitchCall?: (call: ActiveCallItemProps['call']) => void;
  enableCDC?: boolean;
  showLogButton?: boolean;
  logButtonTitle?: string;
  onLogCall?: (...args: any[]) => any;
  onViewContact?: (...args: any[]) => any;
}

export const ActiveCallItem: FunctionComponent<newActiveCallItemProps> = ({
  warmTransferRole,
  call,
  disableLinks = false,
  currentLocale,
  areaCode,
  countryCode,
  enableContactFallback = false,
  brand = 'RingCentral',
  showContactDisplayPlaceholder = true,
  webphoneHangup,
  webphoneResume,
  webphoneReject,
  webphoneSwitchCall,
  webphoneHold,
  webphoneAnswer,
  webphoneToVoicemail,
  sourceIcons = {},
  phoneTypeRenderer,
  phoneSourceNameRenderer,
  renderContactName,
  renderSubContactName,
  // renderExtraButton,
  contactDisplayStyle = '',
  isOnConferenceCall = false,
  conferenceCallParties = [],
  onClick,
  showMergeCall = false,
  showHold = true,
  // showAvatar = true,
  getAvatarUrl = undefined,
  disableMerge = false,
  onMergeCall = (i: any) => i,
  ringoutHangup,
  ringoutTransfer,
  ringoutReject,
  showRingoutCallControl = false,
  showSwitchCall = false,
  showTransferCall = true,
  showHoldOnOtherDevice = false,
  showMultipleMatch = false,
  isOnHold = isOnHoldDefault,
  webphoneIgnore,
  showHoldAnswerBtn,
  showIgnoreBtn,
  clickSwitchTrack,
  formatPhone,
  onSwitchCall = undefined,
  updateSessionMatchedContact = (id: string, value: any) => id,
  isLogging = false,
  showLogButton = false,
  logButtonTitle = '',
  onLogCall,
  enableCDC = false,
  onViewContact,
}) => {
  const {
    direction,
    webphoneSession,
    telephonySessionId,
    telephonySession,
    telephonyStatus,
    startTime,
    offset,
    activityMatches,
  } = call;
  const [selected, setSelected] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [extraNum, setExtraNum] = useState(0);
  const [isLoggingState, setIsLoggingState] = useState(isLogging);
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);
  const userSelectionRef = useRef(false);
  const toVoicemailTimeoutRef = useRef(-1);
  const contactMatchesRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (toVoicemailTimeoutRef.current) {
        window.clearTimeout(toVoicemailTimeoutRef.current);
        toVoicemailTimeoutRef.current = -1;
      }
    };
  }, []);

  useEffect(() => {
    setIsLoggingState(isLogging);
  }, [isLogging]);

  const onSelectContact = useCallback((value, idx) => {
    if (!value || typeof getAvatarUrl !== 'function') {
      return;
    }
    userSelectionRef.current = true;
    setSelected(idx);
    if (value) {
      getAvatarUrl(value).then((avatarUrl) => {
        if (mountedRef.current) {
          setAvatarUrl(avatarUrl);
        }
      });
      updateSessionMatchedContact({
        webphoneSessionId: call.webphoneSession?.id,
        contact: value,
        telephonySessionId: call.telephonySessionId,
      });
    }
  }, [call, getAvatarUrl, updateSessionMatchedContact]);

  useEffect(() => {
    if (isOnConferenceCall) {
      setAvatarUrl(conferenceCallParties.map((profile) => profile.avatarUrl)[0]);
      setExtraNum(
        conferenceCallParties.length > 0
          ? conferenceCallParties.length - 1
          : 0,
      );
      return;
    }
    const contactMatches = getContactMatches(call);
    if (contactMatchesRef.current !== contactMatches) {
      contactMatchesRef.current = contactMatches;
      const newSelected = getSelectedContactIdx(call, contactMatches);
      const selectedContact = getSessionContact(call, newSelected);
      onSelectContact(selectedContact, newSelected);
    }
  }, [call, isOnConferenceCall, conferenceCallParties]);

  const onClickSwitchBtn = () => {
    if (onSwitchCall) {
      onSwitchCall(call);
      return;
    }
    setSwitchDialogOpen(true);
  };

  const phoneNumber = getPhoneNumber(call);
  const contactMatches = getContactMatches(call);
  const fallbackContactName = getFallbackContactName(call);
  const ringing = isRinging(call);
  const inbound = isInbound(call);
  const contactName =
    typeof renderContactName === 'function'
      ? renderContactName(call)
      : undefined;
  const subContactName =
    typeof renderSubContactName === 'function'
      ? renderSubContactName(call)
      : undefined;
  // const extraButton =
  //   typeof renderExtraButton === 'function' ? (
  //     <div className={styles.extraButton}>
  //       {renderExtraButton(call)}
  //     </div>
  //   ) : undefined;
  const hasCallControl = !!(
    webphoneSession ||
    showRingoutCallControl ||
    showSwitchCall
  );
  const voicemailDropStatus = webphoneSession?.voicemailDropStatus;
  const cursorPointer = hasCallControl && !!onClick && !voicemailDropStatus;
  // real outbound call status
  const isConnecting =
    telephonySession?.otherParties[0]?.status?.code ===
    telephonySessionStatus.proceeding;

  const isLogged = activityMatches && activityMatches.length > 0;
  const logCall = async (redirect = true, isSelected = selected, type) => {
    if (typeof onLogCall === 'function' && !isLogging) {
      setIsLoggingState(true);
      try {
        await onLogCall({
          contact: getSessionContact(call, isSelected),
          call: call,
          redirect,
          triggerType: type,
        });
        setIsLoggingState(false);
      } catch (e) {
        setIsLoggingState(false);
        throw e;
      }
    }
  };

  let actions = [];
  if (showLogButton) {
    actions.push({
      icon: isLogged ? Edit : NewAction,
      title: (isLogged ? i18n.getString('editLog', currentLocale) : logButtonTitle) || i18n.getString('logCall', currentLocale),
      onClick: () => {
        logCall(true, undefined, isLogged ? 'editLog' : 'createLog');
      },
      disabled: disableLinks || isLogging || isLoggingState,
    });
  }
  if (webphoneSession) {
    actions = actions.concat(getWebphoneActions({
      session: webphoneSession,
      isConnecting,
      telephonySessionId,
      webphoneReject: (sessionId, telephonySessionId) => {
        if (typeof webphoneToVoicemail !== 'function') {
          return;
        }
        webphoneToVoicemail(sessionId, telephonySessionId);
        toVoicemailTimeoutRef.current = window.setTimeout(() => {
          webphoneReject(sessionId, telephonySessionId);
        }, 3000);
      },
      webphoneHangup,
      webphoneResume,
      webphoneHold,
      currentLocale,
      showMergeCall: showMergeCall && !voicemailDropStatus,
      showHold: showHold && !voicemailDropStatus,
      disableMerge,
      onMergeCall,
      webphoneAnswer,
      isOnHold,
      webphoneIgnore,
      showIgnoreBtn,
      showHoldAnswerBtn,
      disableLinks,
    }));
  } else {
    actions = actions.concat(getActiveCallControlActions({
      session: telephonySession,
      showSwitchCall: !webphoneSession && showSwitchCall,
      onClickSwitchBtn,
      showRingoutCallControl,
      telephonySessionId,
      disableLinks,
      currentLocale,
      ringing,
      inbound,
      ringoutReject,
      ringoutHangup,
      ringoutTransfer,
      showTransferCall,
      showHoldOnOtherDevice,
      webphoneResume,
      webphoneHold,
      isConnecting,
      clickSwitchTrack,
    }));
  }
  if (showLogButton && isLogged) {
    actions.push({
      icon: ViewLogBorder,
      title: 'View log details',
      onClick: () => logCall(true, undefined, 'viewLog'),
      disabled: disableLinks || isLogging || isLoggingState,
    });
  }
  const viewSelectedContact = () => {
    if (typeof onViewContact !== 'function') return;

    const activityMatches = (call && call.activityMatches) || [];
    onViewContact({
      activityMatches,
      contactMatches,
      contact: getSessionContact(call, selected),
      phoneNumber,
    });
  };
  const hasEntity = !!contactMatches.length;
  const isContactMatchesHidden = enableCDC && checkShouldHideContactUser(contactMatches);
  if (!isContactMatchesHidden && hasEntity) {
    actions.push({
      id: 'viewContact',
      icon: People,
      title: "View contact details",
      onClick: viewSelectedContact,
      disabled: disableLinks,
    });
  }
  return (
    <StyledListItem
      data-sign="callItem"
      $hoverOnMoreMenu={hoverOnMoreMenu}
      $cursorPointer={cursorPointer}
    >
      <RcListItemAvatar
        onClick={hasCallControl && !voicemailDropStatus && onClick ? onClick : undefined}
      >
        <CallIcon
          isOnConferenceCall={isOnConferenceCall}
          avatarUrl={avatarUrl}
        />
      </RcListItemAvatar>
      <RcListItemText
        data-sign="callNameAndDurationWrap"
        onClick={hasCallControl && !voicemailDropStatus && onClick ? onClick : undefined}
        primary={
          <ContactDisplay
            warmTransferRole={warmTransferRole}
            formatPhone={formatPhone}
            isOnConferenceCall={isOnConferenceCall}
            contactName={showMultipleMatch ? undefined : contactName}
            subContactName={subContactName}
            className={classnames(
              styles.contactDisplay,
              contactDisplayStyle,
            )}
            contactMatches={contactMatches}
            selected={selected}
            onSelectContact={onSelectContact}
            disabled={!showMultipleMatch}
            iconClassName={showMultipleMatch ? undefined : styles.selectIcon}
            isLogging={isLogging}
            fallBackName={fallbackContactName}
            enableContactFallback={enableContactFallback}
            stopPropagation={false}
            areaCode={areaCode}
            countryCode={countryCode}
            phoneNumber={phoneNumber}
            currentLocale={currentLocale}
            brand={brand}
            showPlaceholder={showContactDisplayPlaceholder}
            showType={false}
            sourceIcons={sourceIcons}
            phoneTypeRenderer={phoneTypeRenderer}
            phoneSourceNameRenderer={phoneSourceNameRenderer}
          />
        }
        secondary={
          <StyledSecondary>
            <DetailArea>
              {
                voicemailDropStatus ?
                  VOICEMAIL_DROP_STATUS_MAP[voicemailDropStatus] :
                  i18n.getString(telephonyStatus, currentLocale)
              }
            </DetailArea>
            <span className="call-item-time" data-sign="duration">
              <DurationCounter startTime={startTime} offset={offset} />
            </span>
          </StyledSecondary>
        }
      />
      <StyledActionMenu
        actions={actions}
        size="small"
        maxActions={3}
        className="call-item-action-menu"
        iconVariant="contained"
        color="neutral.b01"
        onMoreMenuOpen={(open) => {
          setHoverOnMoreMenu(open);
        }}
      />
      <SwitchDialog
        open={switchDialogOpen}
        onClose={() => setSwitchDialogOpen(false)}
        onSwitch={() => {
          setSwitchDialogOpen(false);
          webphoneSwitchCall(call);
        }}
        contactName={contactName?.title || contactName || getPhoneNumber(call)}
        currentLocale={currentLocale}
      />
    </StyledListItem>
  );
};
