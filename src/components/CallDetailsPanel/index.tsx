import React, { useState, useRef, useEffect } from 'react';
import classnames from 'classnames';
import { styled, palette2 } from '@ringcentral/juno/foundation';
import { RcIconButton, RcTypography } from '@ringcentral/juno';
import { isInbound, isMissed } from '@ringcentral-integration/commons/lib/callLogHelpers';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import { parseNumber } from '@ringcentral-integration/commons/lib/parseNumber';
import ContactDisplay from '@ringcentral-integration/widgets/components/ContactDisplay';
import usePromise from '@ringcentral-integration/widgets/react-hooks/usePromise';
import { checkShouldHidePhoneNumber } from '@ringcentral-integration/widgets/lib/checkShouldHidePhoneNumber';
import styles from '@ringcentral-integration/widgets/components/CallItem/styles.scss';
import { ActionMenu } from '../ActionMenu';
import { AudioPlayer } from '../AudioPlayer';
import { CallIcon } from '../CallItem/CallIcon';
import {
  getPhoneNumber,
  getContactMatches,
  getInitialContactIndex,
  getSelectedContact,
  getFallbackContactName,
  getActions,
} from '../CallItem/helper';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-left: 16px;
  padding-right: 16px;
`;

const StyleSection = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${palette2('neutral', 'l03')};
  width: 100%;
  margin-bottom: 8px;
`;

const SectionRightArea = styled.div`
  display: flex;
  flex-direction: row;
`;

const SectionTitle = styled(RcTypography)`
  margin-bottom: 5px;
`;

const StyledActionButtons = styled(ActionMenu)`
  justify-content: center;
  width: 100%;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const StyledAudioPlayer = styled(AudioPlayer)`
  flex: 1;
`;

const DownloadLink = styled.a`
  display: none;
`;

export function CallDetailsPanel({
  telephonySessionId,
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
  enableCDC = false,
  maxExtensionNumberLength = 6,
  formatPhone = (phoneNumber: string) => phoneNumber,
  call,
  recording,
  brand,
  currentLocale,
  areaCode,
  countryCode,
  onViewContact,
  onCreateContact,
  onRefreshContact,
  onLogCall,
  onClickToDial,
  onClickToSms,
  dateTimeFormatter,
  enableContactFallback,
  sourceIcons,
  phoneSourceNameRenderer,
  renderContactName,
  renderSubContactName,
  showLogButton,
  hideEditLogButton,
  logButtonTitle,
  onViewSmartNote,
  aiNoted,
  onViewCall,
  additionalActions,
  onClickAdditionalAction,
}) {
  const downloadRef = useRef(null);
  const [selected, setSelected] = useState(0);
  const [isLogging, setIsLogging] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const mounted = usePromise();
  useEffect(() => {
    onViewCall(telephonySessionId)
  }, [telephonySessionId]);

  useEffect(() => {
    if (!call) {
      return;
    }
    setSelected(getInitialContactIndex(call, showContactDisplayPlaceholder, isLoggedContact));
  }, [call, showContactDisplayPlaceholder]);

  useEffect(() => {
    setIsLogging(isLoggingProp);
  }, [isLoggingProp]);

  if (!call) {
    return null;
  }
  const { direction, startTime, type, toName, to, from } = call;
  const missed = isInbound(call) && isMissed(call);
  const self = direction === callDirections.inbound ? to : from;
  const time = dateTimeFormatter({ utcTimestamp: startTime });
  const contactName = renderContactName?.(call);
  const subContactName = renderSubContactName?.(call);
  const phoneNumber = getPhoneNumber(call);
  const parsedInfo = parseNumber({
    phoneNumber,
    countryCode: countryCode as never,
    areaCode,
  });
  const isExtension =
    !parsedInfo.hasPlus &&
    parsedInfo.number &&
    parsedInfo.number.length <= maxExtensionNumberLength;
  const contactMatches = getContactMatches(call);
  const fallbackContactName = getFallbackContactName(call);
  const shouldHideNumber =
    enableCDC && checkShouldHidePhoneNumber(phoneNumber, contactMatches);
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
  const contactDisplay = (
    <ContactDisplay
      formatPhone={formatPhone}
      missed={missed}
      isOnConferenceCall={
        direction === callDirections.outbound && toName === 'Conference'
      }
      contactName={contactName}
      subContactName={subContactName}
      className={classnames(
        styles.contactDisplay,
        missed && styles.missed,
      )}
      selectClassName={styles.dropdownSelect}
      brand={brand}
      sourceIcons={sourceIcons}
      phoneSourceNameRenderer={phoneSourceNameRenderer}
      // TODO: find correct type
      contactMatches={contactMatches as never}
      selected={selected}
      onSelectContact={(value: any, idx: any) => {
        const selected = showContactDisplayPlaceholder
          ? parseInt(idx, 10) - 1
          : parseInt(idx, 10);
        setSelected(selected);
        if (autoLog) {
          logCall(false, selected, 'contactUpdated');
        }
      }}
      disabled={disableLinks}
      isLogging={isLogging}
      fallBackName={fallbackContactName}
      enableContactFallback={enableContactFallback}
      areaCode={areaCode}
      countryCode={countryCode}
      phoneNumber={shouldHideNumber ? undefined : phoneNumber}
      currentLocale={currentLocale}
      stopPropagation={false}
      showType={false}
      showPlaceholder={showContactDisplayPlaceholder}
      currentSiteCode={currentSiteCode}
      isMultipleSiteEnabled={isMultipleSiteEnabled}
    />
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
    isRecording: !!recording,
    onDownload: () => {
      downloadRef.current?.click();
    },
    additionalActions,
    onClickAdditionalAction,
    formatPhone,
  });
  const mainActions = actions.filter((action) => action.id !== 'download');
  const downloadAction = actions.find((action) => action.id === 'download');
  return (
    <Container>
      <CallIcon
        direction={direction}
        missed={missed}
        currentLocale={currentLocale}
        type={type}
      />
      <br />
      {contactDisplay}
      <StyledActionButtons
        actions={mainActions}
        maxActions={4}
      />
      <StyleSection>
        <SectionTitle
          variant="caption2"
          color="neutral.f06"
        >
          {time}
        </SectionTitle>
        <SectionRightArea>
          <StyledAudioPlayer
            uri={recording.contentUri}
            disabled={disableLinks}
            currentLocale={currentLocale}
          />
          {
            downloadAction ? (
              <RcIconButton
                symbol={downloadAction.icon}
                title={downloadAction.title}
                onClick={downloadAction.onClick}
                disabled={downloadAction.disabled}
              />
            ) : null
          }
        </SectionRightArea>
      </StyleSection>
      {
        self ? (
          <StyleSection>
            <SectionTitle
              variant="caption2"
              color="neutral.f06"
            >
              {direction === callDirections.inbound ? 'To' : 'From'}
            </SectionTitle>
            <RcTypography variant="body1">
              {self.phoneNumber ? formatPhone(self.phoneNumber) : self.extension}
            </RcTypography>
          </StyleSection>
        ) : null
      }
      {
        recording && (
          <DownloadLink
            target="_blank"
            download
            title="Download"
            ref={downloadRef}
            href={`${recording.contentUri}&contentDisposition=Attachment`}
          ></DownloadLink>
        )
      }
    </Container>
  );
}
