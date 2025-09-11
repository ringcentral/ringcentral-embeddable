import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import type { ContactModel } from '@ringcentral-integration/commons/interfaces/Contact.model';
import type {
  clickToDial,
  clickToSMS,
  formatNumber,
  onClickMailTo,
  sourceNodeRenderer,
} from '@ringcentral-integration/widgets/components/ContactDetails/ContactDetails.interface';
import type { GetPresenceFn } from '@ringcentral-integration/widgets/react-hooks/usePresence';
import { usePresence } from '@ringcentral-integration/widgets/react-hooks/usePresence';
import { getPresenceStatus } from '@ringcentral-integration/widgets/modules/ContactSearchUI/ContactSearchHelper';
import { getPresenceStatusName } from '@ringcentral-integration/widgets/lib/getPresenceStatusName';
import { extensionStatusTypes } from '@ringcentral-integration/commons/enums/extensionStatusTypes';
import {
  styled,
  palette2,
  RcTypography,
  RcTabs,
  RcTab,
} from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/ContactDetails/i18n';
import { Calls } from './Calls';
import { Messages } from './Messages';
import { Activities } from './Activities';
import { WidgetAppsPanel } from '../WidgetAppsPanel';
import { ContactAvatar } from '../ContactAvatar';

import {
  PhoneSection,
  EmailSection,
  CompanySection,
  SiteSection,
} from './DetailSections';
interface ContactDetailsProps extends onClickMailTo,
  clickToSMS,
  clickToDial,
  formatNumber,
  sourceNodeRenderer {
  currentLocale: string;
  contact: ContactModel;
  disableLinks: boolean;
  isMultipleSiteEnabled: boolean;
  isCallButtonDisabled: boolean;
  getPresence: GetPresenceFn;
  messages: any[];
  calls: any[];
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
  pinAppIds: string[];
  toggleAppPin: (appId: string) => void;
  openAppTab: (appId: string, contact: ContactModel) => void;
  additionalActions: any[];
  onClickAdditionalAction: (buttonId: string, data: any) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  align-items: center;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
`;

const Name = styled(RcTypography)`
  margin-top: 5px;
`;

const SubInfo = styled(RcTypography)`
  margin-bottom: 5px;
  color: ${palette2('neutral', 'f04')};
  font-size: 0.875rem;
`;

const SourceIcon = styled.div`
  position: absolute;
  top: 14%;
  right: 14%;
  transform: translate(50%, -50%);
  width: 16px;
  height: 16px;
  border-radius: 10px;
  overflow: hidden;
`;

const ProfileWrapper = styled.div`
  position: relative;
`;

const Profile = ({
  contact,
  sourceNodeRenderer,
  currentLocale,
  getPresence,
  fullName,
  notActivated,
}) => {
  const presence = usePresence(contact, { fetch: getPresence });
  let presenceName = presence ? getPresenceStatusName(
    presence.presenceStatus,
    presence.dndStatus,
    currentLocale,
  ) : '';
  let presenceType = presence ? getPresenceStatus(presence) : undefined;
  if (notActivated) {
    presenceName = i18n.getString('notActivated', currentLocale);
    presenceType = 'unavailable';
  }

  return (
    <ProfileWrapper>
      <ContactAvatar
        size="medium"
        contact={contact}
        fullName={fullName}
        presenceOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        presenceProps={presence ? {
          type: presenceType,
          title: presenceName,
        } : undefined}
      />
      {
          sourceNodeRenderer && (
            <SourceIcon>
              {sourceNodeRenderer({ sourceType: contact.type })}
            </SourceIcon>
          )
        }
    </ProfileWrapper>
  );
}

const StyledTabs = styled(RcTabs)`
  width: 100%;
  min-height: 34px;
  background: ${palette2('neutral', 'b01')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
`;

const StyledTab = styled(RcTab)`
  font-size: 0.875rem;
`;

const DetailsArea = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  width: 100%;
`;

const EmptyFunction = () => {};

export const ContactDetails: FunctionComponent<ContactDetailsProps> = ({
  contact,
  currentLocale,
  onClickMailTo,
  disableLinks,
  isMultipleSiteEnabled,
  isCallButtonDisabled,
  canCallButtonShow,
  canTextButtonShow,
  formatNumber,
  onClickToDial,
  onClickToSMS,
  sourceNodeRenderer,
  getPresence,
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
  pinAppIds,
  toggleAppPin,
  openAppTab,
  additionalActions,
  onClickAdditionalAction,
}) => {
  const fullName = contact.name || `${contact.firstName} ${contact.lastName}`;
  const [infoTab, setInfoTab] = useState('user-info');

  if (!contact) {
    return null;
  }

  const notActivated = contact.status === extensionStatusTypes.notActivated;
  const tabs = [{
    value: 'user-info',
    label: 'Details',
  }, {
    value: 'calls',
    label: 'Calls',
  }, {
    value: 'messages',
    label: 'Messages',
  }];
  if (showActivities) {
    tabs.push({
      value: 'activities',
      label: activitiesTabName
    });
  }
  if (showApps) {
    tabs.push({
      value: 'apps',
      label: 'Apps',
    });
  }
  return (
    <Container>
      <Profile
        contact={contact}
        sourceNodeRenderer={sourceNodeRenderer}
        currentLocale={currentLocale}
        getPresence={getPresence}
        fullName={fullName}
        notActivated={notActivated}
      />
      <Name variant="subheading1" color="neutral.f06">{fullName}</Name>
      {
        notActivated && (
          <SubInfo variant="body1">
            ({i18n.getString('notActivated', currentLocale)})
          </SubInfo>
        )
      }
      {
        contact.jobTitle ? (
          <SubInfo variant="body1">
            {contact.jobTitle}
          </SubInfo>
        ) : (<br />)
      }
      <StyledTabs
        value={infoTab}
        onChange={(e, value) => setInfoTab(value)}
        variant="moreMenu"
      >
        {
          tabs.map((tab) => (
            <StyledTab
              key={tab.value}
              value={tab.value}
              label={tab.label}
            />
          ))
        }
      </StyledTabs>
      <DetailsArea>
        {
          infoTab === 'user-info' && (
            <>
              <SiteSection
                isMultipleSiteEnabled={isMultipleSiteEnabled}
                site={contact.site}
                currentLocale={currentLocale}
              />
              <PhoneSection
                contact={contact}
                currentLocale={currentLocale}
                disableLinks={disableLinks}
                isCallButtonDisabled={isCallButtonDisabled}
                isMultipleSiteEnabled={isMultipleSiteEnabled}
                formatNumber={formatNumber}
                canCallButtonShow={canCallButtonShow}
                canTextButtonShow={canTextButtonShow}
                onClickToDial={onClickToDial}
                onClickToSMS={onClickToSMS}
                additionalActions={additionalActions}
                onClickAdditionalAction={onClickAdditionalAction}
              />
              <EmailSection
                emails={contact.emails}
                contactType={contact.type}
                currentLocale={currentLocale}
                onClickMailTo={onClickMailTo}
              />
              <CompanySection
                company={contact.company}
                currentLocale={currentLocale}
                department={contact.department}
              />
            </>
          )
        }
        {
          infoTab === 'calls' && (
            <Calls
              calls={calls}
              loaded={callLoaded}
              currentLocale={currentLocale}
              loadCalls={loadCalls}
              clearCalls={clearCalls}
              dateTimeFormatter={dateTimeFormatter}
            />
          )
        }
        {
          infoTab === 'messages' && (
            <Messages
              currentLocale={currentLocale}
              messages={messages}
              loaded={messagesLoaded}
              loadMessages={loadMessages}
              clearMessages={clearMessages}
              navigateTo={navigateTo}
              dateTimeFormatter={dateTimeFormatter}
            />
          )
        }
        {
          infoTab === 'activities' && (
            <Activities
              activities={activities}
              loaded={activitiesLoaded}
              loadActivities={loadActivities}
              clearActivities={clearActivities}
              openItem={openActivityDetail}
              currentLocale={currentLocale}
              dateTimeFormatter={dateTimeFormatter}
            />
          )
        }
        {
          infoTab === 'apps' && (
            <WidgetAppsPanel
              apps={apps}
              showCloseButton={false}
              onClose={EmptyFunction}
              onLoadApp={onLoadApp}
              contact={contact}
              toggleAppPin={toggleAppPin}
              pinAppIds={pinAppIds}
              openAppTab={openAppTab}
            />
          )
        }
      </DetailsArea>
    </Container>
  );
}
