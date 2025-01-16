import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import classnames from 'classnames';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import {
  isInbound,
  isMissed,
} from '@ringcentral-integration/commons/lib/callLogHelpers';
import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';
import { parseNumber } from '@ringcentral-integration/commons/lib/parseNumber';

import {
  usePrevious,
  RcListItemText,
  RcIcon,
  styled,
} from '@ringcentral/juno';
import {
  PlayCircleBorder,
  AiSmartNotes,
  Disposition,
  ExtensionLineBorder,
} from '@ringcentral/juno-icon';
import { checkShouldHidePhoneNumber } from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import usePromise from '@ringcentral-integration/widgets/react-hooks/usePromise';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import DurationCounter from '@ringcentral-integration/widgets/components/DurationCounter';

import i18n from '@ringcentral-integration/widgets/components/CallItem/i18n';
import styles from '@ringcentral-integration/widgets/components/CallItem/styles.scss';

import { CallIcon } from './CallIcon';
import { StatusMessage } from './StatusMessage';
import {
  getPhoneNumber,
  getContactMatches,
  getInitialContactIndex,
  getSelectedContact,
  getFallbackContactName,
  getActions,
} from './helper';

import {
  StyledListItem,
  StyledItemIcon,
  StyledSecondary,
  DetailArea,
  StyledActionMenu,
} from './styled';

type CallItemProps = {
  // renderIndex?: number;
  // extended?: boolean;
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
  onRefreshContact?: (...args: any[]) => any;
  // createEntityTypes?: any[];
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
  // withAnimation?: boolean;
  currentSiteCode?: string;
  isMultipleSiteEnabled?: boolean;
  // showChooseEntityModal?: boolean;
  enableCDC?: boolean;
  maxExtensionNumberLength?: number;
  formatPhone?: (...args: any[]) => any;
  isRecording?: boolean;
  onViewSmartNote?: (...args: any[]) => any;
  aiNoted: boolean;
  showLogButton?: boolean;
  hideEditLogButton?: boolean;
  logButtonTitle?: string;
};

const DownloadLink = styled.a`
  display: none;
`;

const IconBadge = styled(RcIcon)`
  margin-left: 8px;
`;

const StyledStatusMessage = styled(StatusMessage)`
  margin-left: 8px;
`;

export const CallItem: FunctionComponent<CallItemProps> = ({
  currentSiteCode = '',
  isMultipleSiteEnabled = false,
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
  // withAnimation = true,
  // showChooseEntityModal = true,
  enableCDC = false,
  maxExtensionNumberLength = 6,
  formatPhone = (phoneNumber: string) => phoneNumber,
  // renderIndex,
  call,
  brand,
  currentLocale,
  areaCode,
  countryCode,
  active,
  onViewContact,
  onCreateContact,
  onRefreshContact,
  // createEntityTypes,
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
  hideEditLogButton,
  logButtonTitle,
  isRecording = false,
  onViewSmartNote,
  aiNoted,
  onViewCallDetails,
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

  const mounted = usePromise();
  const [selected, setSelected] = useState(getInitialContactIndex(call, showContactDisplayPlaceholder, isLoggedContact));
  const [isLogging, setIsLogging] = useState(isLoggingProp);
  const [isCreating, setIsCreating] = useState(false);
  const [hoverOnMoreMenu, setHoverOnMoreMenu] = useState(false);
  const downloadRef = useRef(null);

  const contactDisplayRef = useRef<HTMLElement | null>(null);
  const userSelectionRef = useRef(false);
  const previousCall = usePrevious(() => call);

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

  const logCall = async (redirect = true, isSelected = selected, type) => {
    if (typeof onLogCall === 'function' && !isLogging) {
      setIsLogging(true);
      try {
        await mounted(
          onLogCall({
            contact: getSelectedContact(isSelected, call),
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

  const createSelectedContact = async (entityType: any) => {
    if (typeof onCreateContact === 'function' && !isCreating) {
      setIsCreating(true);
      const phoneNumber = getPhoneNumber(call);
      await mounted(
        onCreateContact({
          phoneNumber,
          name: enableContactFallback ? getFallbackContactName(call) : '',
          entityType,
        }),
      );

      setIsCreating(false);
    }
  };

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
      setSelected(getInitialContactIndex(call, showContactDisplayPlaceholder, isLoggedContact));
    }
  }, [call, previousCall, showContactDisplayPlaceholder]);

  const phoneNumber = getPhoneNumber(call);
  const contactMatches = getContactMatches(call);
  const shouldHideNumber =
    enableCDC && checkShouldHidePhoneNumber(phoneNumber, contactMatches);
  const fallbackContactName = getFallbackContactName(call);

  // const ringing = isRinging(call);
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
  const isLogged = activityMatches.length > 0 && activityMatches.find(
    (activity) => activity.type !== 'status',
  );
  const statusMatch = activityMatches.find(
    (activity) => activity.type === 'status',
  );
  const actions = getActions({
    call,
    isExtension,
    showLogButton,
    hideEditLogButton,
    logButtonTitle,
    logCall,
    disableLinks,
    isLogging,
    onClickToDial,
    currentLocale,
    selected,
    disableCallButton,
    disableClickToDial,
    onClickToSms,
    countryCode,
    areaCode,
    maxExtensionNumberLength,
    enableContactFallback,
    internalSmsPermission,
    outboundSmsPermission,
    readTextPermission,
    onViewSmartNote,
    aiNoted,
    enableCDC,
    onViewContact,
    onCreateContact,
    createSelectedContact,
    onRefreshContact,
    isRecording,
    onDownload: () => {
      downloadRef.current?.click();
    },
  });
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

  const openRecording = () => {
    onViewCallDetails(call.telephonySessionId);
  };

  return (
    <StyledListItem
      data-sign="calls_item_root"
      $hoverOnMoreMenu={hoverOnMoreMenu}
      $clickable={!!isRecording}
    >
      <StyledItemIcon
        onClick={isRecording ? openRecording: undefined}
      >
        <CallIcon
          direction={direction!}
          currentLocale={currentLocale}
          // ringing={ringing}
          // active={active}
          missed={missed}
          type={type}
        />
      </StyledItemIcon>
      <RcListItemText
        onClick={isRecording ? openRecording: undefined}
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
              {
                isExtension && (
                  <IconBadge
                    symbol={ExtensionLineBorder}
                    size="small"
                    title="Internal call"
                  />
                )
              }
              {
                aiNoted && (
                  <IconBadge
                    symbol={AiSmartNotes}
                    size="small"
                    color="label.purple01"
                    title="Smart note"
                  />
                )
              }
              {
                isLogged && (
                  <IconBadge
                    symbol={Disposition}
                    size="small"
                    title="Logged"
                  />
                )
              }
              {
                statusMatch && (
                  <StyledStatusMessage
                    statusMatch={statusMatch}
                  />
                )
              }
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
        isRecording && recording && (
          <DownloadLink
            target="_blank"
            download
            title="Download"
            ref={downloadRef}
            href={`${recording.contentUri}&contentDisposition=Attachment`}
          ></DownloadLink>
        )
      }
    </StyledListItem>
  );
};
