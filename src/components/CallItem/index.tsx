import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import classnames from 'classnames';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import {
  isInbound,
  isMissed,
  isRinging,
} from '@ringcentral-integration/commons/lib/callLogHelpers';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';
import { parseNumber } from '@ringcentral-integration/commons/lib/parseNumber';

import {
  useEventCallback,
  usePrevious,
  RcListItemText,
  RcIcon,
} from '@ringcentral/juno';
import {
  PhoneBorder,
  SmsBorder,
  People,
  AddMemberBorder,
  NewAction,
  ViewLogBorder,
  Edit,
  PlayCircleBorder,
} from '@ringcentral/juno-icon';
import { checkShouldHideContactUser } from '@ringcentral-integration/widgets/lib/checkShouldHideContactUser';
import { checkShouldHidePhoneNumber } from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import usePromise from '@ringcentral-integration/widgets/react-hooks/usePromise';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import DurationCounter from '@ringcentral-integration/widgets/components/DurationCounter';

import i18n from '@ringcentral-integration/widgets/components/CallItem/i18n';
import styles from '@ringcentral-integration/widgets/components/CallItem/styles.scss';

import { CallIcon } from './CallIcon';
import { RecordingDialog } from './RecordingDialog';

import {
  StyledListItem,
  StyledItemIcon,
  StyledSecondary,
  DetailArea,
  StyledActionMenu,
} from './styled';

type CallItemProps = {
  renderIndex?: number;
  extended?: boolean;
  // TODO: find correct type
  call: Call & {
    offset: number;
    type: string;
  };
  areaCode: string;
  brand: string;
  countryCode: string;
  currentLocale: string;
  onLogCall?: (...args: any[]) => any;
  onViewContact?: (...args: any[]) => any;
  onCreateContact?: (...args: any[]) => any;
  createEntityTypes?: any[];
  onClickToDial?: (...args: any[]) => any;
  onClickToSms?: (...args: any[]) => any;
  isLoggedContact?: (...args: any[]) => any;
  disableLinks?: boolean;
  disableCallButton?: boolean;
  disableClickToDial?: boolean;
  outboundSmsPermission?: boolean;
  internalSmsPermission?: boolean;
  active: boolean;
  dateTimeFormatter: (...args: any[]) => any;
  isLogging?: boolean;
  enableContactFallback?: boolean;
  autoLog?: boolean;
  showContactDisplayPlaceholder?: boolean;
  sourceIcons?: any;
  phoneTypeRenderer?: (...args: any[]) => any;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  renderContactName?: (...args: any[]) => any;
  renderSubContactName?: (...args: any[]) => any;
  renderExtraButton?: (...args: any[]) => any;
  contactDisplayStyle?: string;
  externalViewEntity?: (...args: any[]) => any;
  externalHasEntity?: (...args: any[]) => any;
  readTextPermission?: boolean;
  withAnimation?: boolean;
  currentSiteCode?: string;
  isMultipleSiteEnabled?: boolean;
  showChooseEntityModal?: boolean;
  enableCDC?: boolean;
  maxExtensionNumberLength?: number;
  formatPhone?: (...args: any[]) => any;
  isRecording?: boolean;
};

export const CallItem: FunctionComponent<CallItemProps> = ({
  currentSiteCode = '',
  isMultipleSiteEnabled = false,
  extended: extendedProp = false,
  isLoggedContact = () => false,
  isLogging: isLoggingProp = false,
  disableClickToDial = false,
  outboundSmsPermission = false,
  internalSmsPermission = false,
  disableLinks = false,
  disableCallButton = false,
  showContactDisplayPlaceholder = true,
  autoLog = false,
  readTextPermission = true,
  withAnimation = true,
  showChooseEntityModal = true,
  enableCDC = false,
  maxExtensionNumberLength = 6,
  formatPhone = (phoneNumber: string) => phoneNumber,
  renderIndex,
  call,
  brand,
  currentLocale,
  areaCode,
  countryCode,
  active,
  onViewContact,
  onCreateContact,
  createEntityTypes,
  onLogCall,
  onClickToDial,
  onClickToSms,
  dateTimeFormatter,
  enableContactFallback,
  sourceIcons,
  phoneSourceNameRenderer,
  renderContactName,
  renderSubContactName,
  renderExtraButton,
  contactDisplayStyle,
  externalViewEntity: externalViewEntityProp,
  externalHasEntity,
  showLogButton,
  logButtonTitle,
  isRecording = false,
}) => {
  const {
    direction,
    telephonyStatus,
    result,
    startTime,
    duration,
    activityMatches = [],
    offset,
    type,
    toName,
    recording,
  } = call;
  const getInitialContactIndex = useEventCallback(() => {
    const contactMatches = getContactMatches()!;

    const activityMatches = call.activityMatches || [];
    for (const activity of activityMatches) {
      const index = contactMatches.findIndex((contact) =>
        isLoggedContact?.(call, activity, contact),
      );
      if (index > -1) return index;
    }
    if (call.toNumberEntity) {
      const index = contactMatches.findIndex(
        (contact) => contact.id === call.toNumberEntity,
      );
      return index;
    }
    return showContactDisplayPlaceholder ? -1 : 0;
  });

  const onSelectContact = (value: any, idx: any) => {
    const selected = showContactDisplayPlaceholder
      ? parseInt(idx, 10) - 1
      : parseInt(idx, 10);
    userSelectionRef.current = true;
    setSelected(selected);
    if (autoLog) {
      logCall(false, selected, 'contactUpdated');
    }
  };

  const getSelectedContact = (isSelected = selected) => {
    const contactMatches = getContactMatches();
    return (
      (isSelected > -1 && contactMatches[isSelected]) ||
      (contactMatches.length === 1 && contactMatches[0]) ||
      null
    );
  };

  const getPhoneNumber = () => {
    return (
      isInbound(call)
        ? call.from!.phoneNumber || call.from!.extensionNumber
        : call.to!.phoneNumber || call.to!.extensionNumber
    ) as string;
  };

  const getContactMatches = () => {
    return (isInbound(call) ? call.fromMatches : call.toMatches) || [];
  };

  const getFallbackContactName = () => {
    return isInbound(call) ? call.from!.name : call.to?.name;
  };

  const logCall = async (redirect = true, isSelected = selected, type) => {
    if (typeof onLogCall === 'function' && !isLogging) {
      setIsLogging(true);
      try {
        await mounted(
          onLogCall({
            contact: getSelectedContact(isSelected),
            call: call,
            redirect,
            triggerType: type,
          }),
        );
        setIsLogging(false);
      } catch (e) {
        setIsLogging(false);
        throw e;
      }
    }
  };

  const viewSelectedContact = () => {
    if (typeof onViewContact !== 'function') return;

    const activityMatches = (call && call.activityMatches) || [];
    onViewContact({
      activityMatches,
      contactMatches: getContactMatches(),
      contact: getSelectedContact(),
      phoneNumber: getPhoneNumber(),
    });
  };

  const createSelectedContact = async (entityType: any) => {
    if (typeof onCreateContact === 'function' && !isCreating) {
      setIsCreating(true);
      const phoneNumber = getPhoneNumber();
      await mounted(
        onCreateContact({
          phoneNumber,
          name: enableContactFallback ? getFallbackContactName() : '',
          entityType,
        }),
      );

      setIsCreating(false);
    }
  };

  const clickToSms = ({ countryCode, areaCode }: any) => {
    if (!onClickToSms) return;

    const phoneNumber = getPhoneNumber()!;
    const contact = getSelectedContact();
    if (contact) {
      onClickToSms({
        ...contact,
        phoneNumber,
      });
    } else {
      const formatted = formatNumber({
        phoneNumber,
        countryCode,
        areaCode,
        maxExtensionLength: maxExtensionNumberLength,
      });
      onClickToSms(
        {
          name: enableContactFallback ? getFallbackContactName() : formatted,
          phoneNumber,
        },
        true,
      );
    }
  };

  const clickToDial = () => {
    if (onClickToDial) {
      const contact = getSelectedContact() || {};
      const phoneNumber = getPhoneNumber();

      if (phoneNumber) {
        onClickToDial({
          ...contact,
          phoneNumber,
        });
      }
    }
  };

  const mounted = usePromise();
  const [selected, setSelected] = useState(getInitialContactIndex());
  const [extended, setExtended] = useState(extendedProp);
  const [isLogging, setIsLogging] = useState(isLoggingProp);
  const [isCreating, setIsCreating] = useState(false);
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);

  const contactDisplayRef = useRef<HTMLElement | null>(null);
  const userSelectionRef = useRef(false);
  const previousCall = usePrevious(() => call);

  useEffect(() => {
    setExtended(extendedProp);
  }, [extendedProp]);

  useEffect(() => {
    setIsLogging(isLoggingProp);
  }, [isLoggingProp]);

  useEffect(() => {
    if (
      !userSelectionRef.current &&
      previousCall &&
      (call.activityMatches !== previousCall?.activityMatches ||
        call.fromMatches !== previousCall?.fromMatches ||
        call.toMatches !== previousCall?.toMatches)
    ) {
      setSelected(getInitialContactIndex());
    }
  }, [call, getInitialContactIndex, previousCall]);

  const phoneNumber = getPhoneNumber();
  const contactMatches = getContactMatches();
  const shouldHideNumber =
    enableCDC && checkShouldHidePhoneNumber(phoneNumber, contactMatches);
  const isContactMatchesHidden =
    enableCDC && checkShouldHideContactUser(contactMatches);
  const fallbackContactName = getFallbackContactName();

  const ringing = isRinging(call);

  const missed = isInbound(call) && isMissed(call);
  const parsedInfo = parseNumber({
    phoneNumber,
    countryCode: countryCode as never,
    areaCode,
  });
  const isExtension =
    !parsedInfo.hasPlus &&
    parsedInfo.number &&
    parsedInfo.number.length <= maxExtensionNumberLength;
  const disableClickToSms = !(
    onClickToSms &&
    (isExtension ? internalSmsPermission : outboundSmsPermission)
  );

  const durationEl =
    typeof duration === 'undefined' ? (
      disableLinks ? (
        i18n.getString('unavailable', currentLocale)
      ) : (
        <DurationCounter startTime={startTime!} offset={offset} />
      )
    ) : (
      formatDuration(duration)
    );
  const dateEl = !active ? dateTimeFormatter({ utcTimestamp: startTime }) : '';
  const statusEl = active
    ? i18n.getString((result || telephonyStatus) as never, currentLocale)
    : '';

  const contactName = renderContactName?.(call);
  const subContactName = renderSubContactName?.(call);
  // const extraButton = renderExtraButton?.(call);

  // const selectedMatchContactType = getSelectedContact()?.type ?? '';
  const actions: any[] = [];
  const isLogged = activityMatches.length > 0;
  if (showLogButton) {
    actions.push({
      icon: isLogged ? Edit : NewAction,
      title: (isLogged ? i18n.getString('editLog', currentLocale) : logButtonTitle) || i18n.getString('logCall', currentLocale),
      onClick: () => logCall(true, undefined, isLogged ? 'editLog' : 'createLog'),
      disabled: disableLinks || isLogging,
    });
  }
  if (onClickToDial) {
    actions.push({
      icon: PhoneBorder,
      title: i18n.getString('call', currentLocale),
      onClick: clickToDial,
      disabled: disableLinks || disableCallButton || disableClickToDial,
    });
  }
  if (onClickToSms) {
    actions.push({
      icon: SmsBorder,
      title: i18n.getString('text', currentLocale),
      onClick: () => clickToSms({ countryCode, areaCode }),
      disabled: disableLinks || disableClickToSms || !phoneNumber || !readTextPermission,
    });
  }
  const hasEntity = !!contactMatches.length;
  if (!isContactMatchesHidden && hasEntity) {
    actions.push({
      icon: People,
      title: i18n.getString('viewDetails', currentLocale),
      onClick: viewSelectedContact,
      disabled: disableLinks,
    });
  }
  if (!hasEntity && phoneNumber && onCreateContact) {
    actions.push({
      icon: AddMemberBorder,
      title: i18n.getString('addEntity', currentLocale),
      onClick: () => createSelectedContact(undefined),
      disabled: disableLinks,
    });
  }
  if (showLogButton && isLogged) {
    actions.push({
      icon: ViewLogBorder,
      title: 'View log details',
      onClick: () => logCall(true, undefined, 'viewLog'),
      disabled: disableLinks || isLogging,
    });
  }
  const contactDisplay = (
    <ContactDisplay
      formatPhone={formatPhone}
      missed={missed}
      isOnConferenceCall={
        direction === callDirections.outbound && toName === 'Conference'
      }
      contactName={contactName}
      subContactName={subContactName}
      reference={(ref) => {
        contactDisplayRef.current = ref;
      }}
      className={classnames(
        styles.contactDisplay,
        contactDisplayStyle,
        missed && styles.missed,
        active && styles.active,
      )}
      selectClassName={styles.dropdownSelect}
      brand={brand}
      sourceIcons={sourceIcons}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      // TODO: find correct type
      contactMatches={contactMatches as never}
      selected={selected}
      onSelectContact={onSelectContact}
      disabled={disableLinks}
      isLogging={isLogging}
      fallBackName={fallbackContactName}
      enableContactFallback={enableContactFallback}
      areaCode={areaCode}
      countryCode={countryCode}
      phoneNumber={shouldHideNumber ? null : phoneNumber}
      currentLocale={currentLocale}
      stopPropagation={false}
      showType={false}
      showPlaceholder={showContactDisplayPlaceholder}
      currentSiteCode={currentSiteCode}
      isMultipleSiteEnabled={isMultipleSiteEnabled}
    />
  );
  return (
    <StyledListItem
      data-sign="calls_item_root"
      $hoverOnMoreMenu={hoverOnMoreMenu}
      $clickable={!!isRecording}
    >
      <StyledItemIcon
        onClick={isRecording ? () => {
          setRecordingDialogOpen(true);
        }: undefined}
      >
        <CallIcon
          direction={direction!}
          // ringing={ringing}
          // active={active}
          missed={missed}
          type={type}
        />
      </StyledItemIcon>
      <RcListItemText
        onClick={isRecording ? () => {
          setRecordingDialogOpen(true);
        }: undefined}
        primary={contactDisplay}
        secondary={
          <StyledSecondary>
            <DetailArea>
              {
                isRecording ? (
                  <RcIcon
                    symbol={PlayCircleBorder}
                    size="xsmall"
                    className='call-item-recording-icon'
                  />
                ) : null
              }
              {durationEl}
            </DetailArea>
            <span className="call-item-time">
              {dateEl}{statusEl}
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
      {
        isRecording && (
          <RecordingDialog
            currentLocale={currentLocale}
            open={recordingDialogOpen}
            onClose={() => setRecordingDialogOpen(false)}
            contactDisplay={contactDisplay}
            missed={missed}
            time={dateEl}
            type={type}
            direction={direction}
            to={call.to}
            from={call.from}
            disableLinks={disableLinks}
            actions={actions}
            countryCode={countryCode}
            areaCode={areaCode}
            maxExtensionLength={maxExtensionNumberLength}
            recording={recording}
          />
        )
      }
    </StyledListItem>
  );
};
