import type { FunctionComponent } from 'react';
import React, { useEffect } from 'react';
import { styled, palette2 } from '@ringcentral/juno';
import type {
  ContactDetailsViewFunctionProps,
  ContactDetailsViewProps,
} from '@ringcentral-integration/widgets/components/ContactDetailsView/ContactDetailsView.interface';
import i18n from '@ringcentral-integration/widgets/components/ContactDetailsView/i18n';

import { BackHeaderView } from '../BackHeaderView';
import { ContactDetails } from './ContactDetails';

interface MessageHolderProps {
  children: string;
}
const MessageHolderWrapper = styled.div`
  color: ${palette2('neutral', 'f05')};
  font-size: 14px;
  text-align: center;
  margin-top: 40px;
`;

const MessageHolder: FunctionComponent<MessageHolderProps> = ({ children }) => {
  return <MessageHolderWrapper>{children}</MessageHolderWrapper>;
};

const StyledPanel = styled.div`
  overflow: hidden;
  padding-top: 0;
  padding-bottom: 0;
  position: relative;
  height: 100%;
  width: 100%;
  background-color: ${palette2('neutral', 'b01')};
  box-sizing: border-box;
`;

type AdditionProps = {
  hideHeader: boolean;
  contactId?: string;
  messages: any[];
  calls: {
    id: string;
    startTime: string;
    direction: string;
    result: string;
  }[];
  callLoaded: boolean;
  messagesLoaded: boolean;
  unreadMessageCounts: number;
  showActivities: boolean;
  activitiesTabName: string;
  activities: any[];
  activitiesLoaded: boolean;
  dateTimeFormatter: (params: { utcTimestamp: number }) => string;
  navigateTo: (path: string) => void;
  loadCalls: () => void;
  clearCalls: () => void;
  loadMessages: () => void;
  clearMessages: () => void;
  loadActivities: () => void;
  clearActivities: () => void;
  openActivityDetail: (activity: any) => void;
  showApps: boolean;
  apps: any[];
  onLoadApp: (data: any) => void;
  defaultAppId?: string;
  setDefaultAppId: (appId: string) => void;
}

export const ContactDetailsView: FunctionComponent<
  ContactDetailsViewFunctionProps & ContactDetailsViewProps & AdditionProps
> = ({
  children,
  contact,
  currentLocale,
  isMultipleSiteEnabled,
  isCallButtonDisabled,
  disableLinks,
  showSpinner,
  formatNumber,
  canCallButtonShow,
  canTextButtonShow,
  onBackClick,
  onVisitPage,
  onLeavingPage,
  onClickMailTo,
  onClickToDial,
  onClickToSMS,
  sourceNodeRenderer,
  getPresence,
  hideHeader,
  contactId,
  messages,
  calls,
  callLoaded,
  messagesLoaded,
  unreadMessageCounts,
  showActivities,
  activitiesTabName,
  activities,
  activitiesLoaded,
  dateTimeFormatter,
  navigateTo,
  loadCalls,
  clearCalls,
  loadMessages,
  clearMessages,
  loadActivities,
  clearActivities,
  openActivityDetail,
  showApps,
  apps,
  onLoadApp,
  defaultAppId,
  setDefaultAppId,
}) => {
  useEffect(() => {
    onVisitPage?.();

    return onLeavingPage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);
  let content;
  if (showSpinner) {
    content = (
      <MessageHolder>
        {i18n.getString('loadingContact', currentLocale)}
      </MessageHolder>
    );
  } else if (!contact) {
    content = (
      <MessageHolder>
        {i18n.getString('contactNotFound', currentLocale)}
      </MessageHolder>
    );
  } else {
    content = (
      <ContactDetails
        currentLocale={currentLocale}
        contact={contact}
        canCallButtonShow={canCallButtonShow}
        canTextButtonShow={canTextButtonShow}
        onClickToSMS={onClickToSMS}
        onClickToDial={onClickToDial}
        isMultipleSiteEnabled={isMultipleSiteEnabled}
        isCallButtonDisabled={isCallButtonDisabled}
        disableLinks={disableLinks}
        onClickMailTo={onClickMailTo}
        formatNumber={formatNumber}
        sourceNodeRenderer={sourceNodeRenderer}
        getPresence={getPresence}
        messages={messages}
        calls={calls}
        callLoaded={callLoaded}
        messagesLoaded={messagesLoaded}
        unreadMessageCounts={unreadMessageCounts}
        showActivities={showActivities}
        activitiesTabName={activitiesTabName}
        activities={activities}
        activitiesLoaded={activitiesLoaded}
        dateTimeFormatter={dateTimeFormatter}
        navigateTo={navigateTo}
        loadCalls={loadCalls}
        clearCalls={clearCalls}
        loadMessages={loadMessages}
        clearMessages={clearMessages}
        loadActivities={loadActivities}
        clearActivities={clearActivities}
        openActivityDetail={openActivityDetail}
        showApps={showApps}
        apps={apps}
        onLoadApp={onLoadApp}
        defaultAppId={defaultAppId}
        setDefaultAppId={setDefaultAppId}
      />
    );
  }

  return (
    <BackHeaderView
      dataSign="contactDetails"
      onBack={onBackClick}
      title={i18n.getString('contactDetails', currentLocale)}
      hideHeader={hideHeader}
    >
      <StyledPanel>
        {content}
        {children}
      </StyledPanel>
    </BackHeaderView>
  );
};
