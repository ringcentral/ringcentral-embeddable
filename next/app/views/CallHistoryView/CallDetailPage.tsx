import {
  isInbound as isInboundCall,
  isMissed as isMissedCall,
} from "@ringcentral-integration/commons/lib/callLogHelpers";
import {
  AppFooterNav,
  AppHeaderNav,
  CopyIconButtonSpring,
} from "@ringcentral-integration/micro-core/src/app/components";
import { useLocale } from "@ringcentral-integration/micro-core/src/app/hooks";
import type { CallDetailViewPanelProps } from "@ringcentral-integration/micro-phone/src/app/views/CallDetailView/CallDetail.view.interface";
import callInfoI18n from "@ringcentral-integration/widgets/components/LogBasicInfoV2/i18n";
import {
  ActionMenuList,
  PageHeader,
  PageHeaderBackButton,
  useHistoryActionButtons,
} from "@ringcentral-integration/next-widgets/components";
import {
  IncomingCallMd,
  MissedCallMd,
  OutgoingCallMd,
} from "@ringcentral/spring-icon";
import { Block, BlockHeader, Divider, Icon } from "@ringcentral/spring-ui";
import type { FunctionComponent } from "react";
import React from "react";

import { CallerIdInfoButton } from "../../components/CallerIdInfoButton";
import {
  type SmartNotesCallInfo,
  type SmartNotesHistoryCall,
  insertHistorySmartNotesAction,
  useHistorySmartNotesAction,
} from "./CallHistorySmartNotesAction";
import i18n from "./i18n";

type CallDetailPageProps = CallDetailViewPanelProps & {
  headerTitle?: React.ReactNode;
  hideCallerIdInfo?: boolean;
  scrollCallInfoWithContent?: boolean;
  showLogCallInfo?: boolean;
};

export const CallDetailPage: FunctionComponent<CallDetailPageProps> = (
  props
) => {
  const {
    children,
    currentCallLog,
    footer,
    goBack,
    headerTitle,
    hideCallerIdInfo = false,
    scrollCallInfoWithContent = false,
    showLogCallInfo = false,
    useCallHistoryItemInfo,
    useActionsHandler,
  } = props;
  const { currentLocale, t } = useLocale(i18n);
  const { info, actions } = useCallHistoryItemInfo(currentCallLog, {
    selectIndex: 0,
    variant: "detail",
  });
  const onAction = useActionsHandler(
    currentCallLog,
    info,
    "Call history detail page"
  );
  const buttons = useHistoryActionButtons(actions, onAction);
  const smartNotesAction = useHistorySmartNotesAction(
    currentCallLog as SmartNotesHistoryCall,
    info as unknown as SmartNotesCallInfo,
    t("viewSmartNotes")
  );
  const actionButtons = insertHistorySmartNotesAction(
    buttons,
    smartNotesAction
  );
  const {
    DisplayName,
    displayPhoneNumber,
    formattedPhoneNumber,
    myCallerIdTitle,
    myCallerId,
    Avatar,
    startTime,
    duration,
    Status,
    callQueueName,
    isConferenceCall,
  } = info;
  const meLabel = callQueueName ? "" : `(${t("me")})`;
  const callStatus = currentCallLog.result || currentCallLog.telephonyStatus;
  const callStatusLabel = callStatus
    ? callInfoI18n.getString(callStatus, currentLocale)
    : "";
  const isInbound = isInboundCall(currentCallLog);
  const isMissed = isInbound && isMissedCall(currentCallLog);
  const callerId = (
    isInbound ? currentCallLog.from?.name : currentCallLog.to?.name
  )?.trim();
  const callLogInfo = (
    <>
      <div
        className="flex min-w-0 items-center justify-between gap-3 pb-2"
        data-sign="callLogInfo"
      >
        <div className="flex min-w-0 items-center gap-2">
          <Icon
            className={isMissed ? "text-danger-f" : undefined}
            data-sign="callDirectionIcon"
            size="medium"
            symbol={
              isMissed
                ? MissedCallMd
                : isInbound
                ? IncomingCallMd
                : OutgoingCallMd
            }
          />
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-0.5">
              <p
                className="min-w-0 truncate typography-mainText text-neutral-b0"
                data-sign="callPhoneNumber"
                title={displayPhoneNumber}
              >
                {displayPhoneNumber}
              </p>
              <CallerIdInfoButton
                callerId={callerId}
                dataSign="callCallerIdInfo"
                title={t("callerId", { name: callerId ?? "" })}
              />
            </div>
            {callStatusLabel && (
              <p
                className="truncate typography-descriptor text-neutral-b2"
                data-sign="callStatus"
              >
                {callStatusLabel}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-none flex-col text-right text-neutral-b2">
          <p className="typography-descriptor" data-sign="callDuration">
            {duration}
          </p>
          <p className="typography-descriptor" data-sign="callStartTime">
            {startTime}
          </p>
        </div>
      </div>
      <Divider
        className="mb-2"
        data-sign="callLogInfoDivider"
        orientation="horizontal"
      />
    </>
  );
  const callDetailInfo = (
    <div className="px-4 py-2" data-sign="callDetailInfo">
      {showLogCallInfo && callLogInfo}
      {!hideCallerIdInfo && (
        <Block className="mb-2" data-sign="callerIdInfo">
          <BlockHeader>
            <span className="typography-descriptorMini">{myCallerIdTitle}</span>
            <div className="text-neutral-b2 typography-mainText">
              {myCallerId} {meLabel}
            </div>
          </BlockHeader>
        </Block>
      )}
      {!showLogCallInfo && (
        <Block className="mb-2">
          <BlockHeader data-sign="time-and-status">
            <p className="typography-descriptorMini">{startTime}</p>
            {Status && (
              <div className="typography-mainText">
                <Status />
              </div>
            )}
          </BlockHeader>
        </Block>
      )}
    </div>
  );
  const detailContent = (
    <div
      data-sign="log-notes-transcript-section"
      className={
        scrollCallInfoWithContent
          ? "flex flex-col"
          : "flex-1 min-h-0 flex flex-col"
      }
    >
      {children}
    </div>
  );
  return (
    <div data-sign="CallDetailPage" className="flex flex-col h-full">
      <AppHeaderNav override resetImmediately>
        {headerTitle ? (
          <PageHeader
            onBackClick={goBack}
            endAdornment={
              <ActionMenuList
                buttons={actionButtons}
                displayCount={2}
                variant="plain"
                propsMap={{ all: { variant: "contained" } }}
                moreButtonProps={{ variant: "contained" }}
              />
            }
          >
            <span className="truncate" data-sign="detailPageTitle">
              {headerTitle}
            </span>
          </PageHeader>
        ) : (
          <div className="h-[72px] flex items-center px-2 gap-1 pt-2">
            <PageHeaderBackButton
              onClick={goBack}
              className="flex-none"
              size="medium"
            />
            <div
              className="flex gap-2 items-center flex-auto overflow-hidden"
              data-sign="contactDetail"
            >
              <Avatar size="large" />
              <div className="ml-1 flex flex-col flex-auto overflow-hidden">
                <h2
                  className="text-neutral-b0 truncate typography-subtitle flex items-center gap-1"
                  data-sign="displayName"
                >
                  <DisplayName
                    displayControl={{ maybe: true, matchCounts: true }}
                  />
                </h2>
                {!isConferenceCall && (
                  <div
                    className="flex gap-1 items-center"
                    data-sign="displayNumber"
                  >
                    <p
                      className="typography-descriptor text-neutral-b2 truncate"
                      title={displayPhoneNumber}
                    >
                      {displayPhoneNumber}
                    </p>
                    {formattedPhoneNumber && (
                      <CopyIconButtonSpring text={formattedPhoneNumber} />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1 items-center flex-none">
              <ActionMenuList
                buttons={actionButtons}
                displayCount={2}
                variant="plain"
                propsMap={{ all: { variant: "contained" } }}
                moreButtonProps={{ variant: "contained" }}
              />
            </div>
          </div>
        )}
      </AppHeaderNav>
      {scrollCallInfoWithContent ? (
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          data-sign="callDetailScrollableContent"
        >
          {callDetailInfo}
          {detailContent}
        </div>
      ) : (
        <>
          {callDetailInfo}
          {detailContent}
        </>
      )}
      <AppFooterNav>{footer}</AppFooterNav>
    </div>
  );
};
