import type { FunctionComponent } from 'react';
import React from 'react';

import type { SettingsPanelProps } from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import { BasePanel } from './BasePanel';

import { PresenceSettingSection } from './PresenceSettingSection';
import {
  LinkLineItem,
  SwitchLineItem,
  ButtonLineItem,
  GroupLineItem,
  ExternalLinkLineItem,
} from './SettingItem';
import { AuthSettingsSection } from './AuthSettingsSection';

const Empty = (): null => null;

type ThirdPartySetting = {
  id?: string;
  name: string;
  type: string;
  buttonLabel?: string;
  buttonType?: string;
  value?: boolean;
  order?: number;
  groupId?: string;
  items?: ThirdPartySetting[];
  uri?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  description?: string;
}

type SettingItem = {
  type: string;
  id: string;
  name?: string;
  dataSign?: string;
  show?: boolean;
  onClick?: (...args: any[]) => any;
  customTitle?: string;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (...args: any[]) => any;
  buttonLabel?: string;
  order: number;
  items?: SettingItem[];
  uri?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  description?: string;
}

function getLoggingGroupName(showAutoLog: boolean, showAutoLogSMS: boolean) {
  return `${showAutoLog ? 'Call' : ''}${showAutoLog && showAutoLogSMS ? ' and ' : ''}${showAutoLogSMS ? 'SMS' : ''} logging`;
}

interface NewSettingsPanelProps extends SettingsPanelProps {
  thirdPartyAuth?: {
    serviceName: string;
    serviceInfo?: string;
    authorized: boolean;
    authorizedTitle?: string;
    unauthorizedTitle?: string;
    contactSyncing?: boolean;
    authorizationLogo?: string;
    authorizedAccount?: string;
    showAuthRedDot?: boolean;
  } | null;
  onThirdPartyAuthorize?: () => void;
  disableAutoLogSMSEnabled?: boolean;
  thirdPartySettings?: ThirdPartySetting[];
  gotoThirdPartySection: (id: string) => void;
  onThirdPartyButtonClick: (id: string) => void;
  onSettingToggle: (setting: any) => void;
  autoLogReadOnly?: boolean;
  autoLogReadOnlyReason?: string;
  autoLogSMSReadOnly?: boolean;
  autoLogSMSReadOnlyReason?: string;
  showThemeSetting?: boolean;
  onThemeSettingsLinkClick?: () => void;
}

function ItemRenderer({ item, currentLocale }: {
  item: SettingItem;
  currentLocale: string;
}) {
  if (item.type === 'link') {
    return (
      <LinkLineItem
        name={item.name}
        dataSign={item.dataSign}
        show={item.show}
        currentLocale={currentLocale}
        onClick={item.onClick}
        description={item.description}
      />
    );
  }
  if (item.type === 'switch') {
    return (
      <SwitchLineItem
        name={item.name}
        customTitle={item.customTitle}
        dataSign={item.dataSign}
        show={item.show}
        currentLocale={currentLocale}
        disabled={item.disabled}
        checked={item.checked}
        onChange={item.onChange}
        readOnly={item.readOnly}
        readOnlyReason={item.readOnlyReason}
        description={item.description}
      />
    );
  }
  if (item.type === 'button') {
    return (
      <ButtonLineItem
        name={item.name}
        buttonLabel={item.buttonLabel}
        onClick={item.onClick}
        description={item.description}
      />
    );
  }
  if (item.type === 'externalLink') {
    return (
      <ExternalLinkLineItem
        name={item.name}
        uri={item.uri}
        dataSign={item.dataSign}
        description={item.description}
      />
    );
  }
  if (item.type === 'group') {
    const groupItems =  item.items || [];
    if (groupItems.length === 0) {
      return null;
    }
    const groupItemsShow = !!groupItems.find((subItem) => subItem.show);
    return (
      <GroupLineItem
        name={item.name}
        show={groupItemsShow}
        dataSign={item.dataSign}
        description={item.description}
      >
        {
          groupItems.sort((a, b) => a.order - b.order).map((subItem) => (
            <ItemRenderer
              key={subItem.id}
              item={subItem}
              currentLocale={currentLocale}
            />
          ))
        }
      </GroupLineItem>
    );
  }
  return null;
}

function getSettingItemFromThirdPartyItem({
  item,
  gotoThirdPartySection,
  onThirdPartyButtonClick,
  onSettingToggle,
  order,
}: {
  item: ThirdPartySetting,
  gotoThirdPartySection: (id: string) => void,
  onThirdPartyButtonClick: (id: string) => void,
  onSettingToggle: (setting: ThirdPartySetting) => void,
  order: number,
}): SettingItem {
  if (item.type === 'section') {
    return {
      type: 'link',
      id: item.id || item.name,
      name: item.name,
      dataSign: item.id || item.name,
      show: true,
      onClick: () => gotoThirdPartySection(item.id),
      order,
      description: item.description,
    };
  }
  if (item.type === 'button') {
    if (item.buttonType === 'link') {
      return {
        type: 'link',
        id: item.id || item.name,
        name: item.name,
        dataSign: item.name,
        show: true,
        onClick: () => onThirdPartyButtonClick(item.id),
        order,
        description: item.description,
      };
    }
    return {
      type: 'button',
      id: item.id || item.name,
      name: item.name,
      dataSign: item.name,
      buttonLabel: item.buttonLabel || 'Open',
      show: true,
      onClick: () => onThirdPartyButtonClick(item.id),
      order,
      description: item.description,
    };
  }
  if (item.type === 'boolean') {
    return {
      type: 'switch',
      id: item.id || item.name,
      name: item.name,
      customTitle: item.name,
      dataSign: `thirdPartySettings-${item.id || item.name}`,
      checked: item.value,
      show: true,
      onChange: () => onSettingToggle(item),
      order,
      readOnly: item.readOnly,
      readOnlyReason: item.readOnlyReason,
      description: item.description,
    };
  }
  if (item.type === 'group') {
    return {
      type: 'group',
      id: item.id || item.name,
      order,
      name: item.name,
      items: item.items?.map((subItem) => getSettingItemFromThirdPartyItem({
        item: subItem,
        gotoThirdPartySection,
        onThirdPartyButtonClick,
        onSettingToggle,
        order: subItem.order || 0,
      })),
      dataSign: item.id || item.name,
      description: item.description,
    }
  }
  if (item.type === 'externalLink') {
    return {
      type: 'externalLink',
      id: item.id || item.name,
      name: item.name,
      dataSign: item.name,
      show: true,
      uri: item.uri,
      order,
      description: item.description,
    };
  }
  return null;
}

export const SettingsPanel: FunctionComponent<NewSettingsPanelProps> = ({
  additional,
  autoLogEnabled = false,
  autoLogReadOnly = false,
  autoLogReadOnlyReason = '',
  // autoLogNotesEnabled = false,
  autoLogSMSEnabled = false,
  autoLogSMSTitle,
  autoLogSMSReadOnly = false,
  autoLogSMSReadOnlyReason = '',
  autoLogTitle,
  children,
  className,
  // clickToDialEnabled = false,
  // clickToCallPermission = false,
  // clickToDialTitle,
  currentLocale,
  disableAutoLogEnabled = false,
  // disableAutoLogNotesEnabled = false,
  disableAutoLogSMSEnabled = false,
  dndStatus,
  eulaLabel,
  eulaLink,
  onEulaLinkClick,
  isCallQueueMember,
  loginNumber,
  // logSMSContentEnabled = true,
  // logSMSContentTitle,
  onAudioSettingsLinkClick,
  onAutoLogChange = Empty,
  // onAutoLogNotesChange = Empty,
  onAutoLogSMSChange,
  onCallingSettingsLinkClick,
  // onClickToDialChange,
  onLogoutButtonClick,
  // onLogSMSContentChange = Empty,
  onRegionSettingsLinkClick,
  openPresenceSettings = false,
  // outboundSMS = false,
  setAvailable = Empty,
  setBusy = Empty,
  setDoNotDisturb = Empty,
  setInvisible = Empty,
  showAudio = false,
  showAutoLog = false,
  // showAutoLogNotes = false,
  showAutoLogSMS = false,
  showCalling = false,
  // showClickToDial = false,
  showFeedback = false,
  onFeedbackSettingsLinkClick,
  showHeader = false,
  // showLogSMSContent = false,
  showPresenceSettings = true,
  showRegion = false,
  showSpinner = false,
  toggleAcceptCallQueueCalls = Empty,
  userStatus,
  version,
  versionContainer,
  thirdPartyAuth = null,
  onThirdPartyAuthorize,
  thirdPartySettings = [],
  gotoThirdPartySection,
  onThirdPartyButtonClick,
  onSettingToggle,
  onThemeSettingsLinkClick,
  showThemeSetting,
}) => {
  let settingsItems: SettingItem[] = [{
    type: 'link',
    id: 'calling',
    name: 'calling',
    dataSign: 'calling',
    show: showCalling,
    onClick: onCallingSettingsLinkClick,
    order: 100,
  }, {
    type: 'link',
    id: 'audio',
    name: 'audio',
    dataSign: 'audio',
    show: showAudio,
    onClick: onAudioSettingsLinkClick,
    order: 200,
  }, {
    type: 'link',
    id: 'region',
    name: 'region',
    dataSign: 'region',
    show: showRegion,
    onClick: onRegionSettingsLinkClick,
    order: 300,
  }, {
    type: 'presence',
    id: 'presence',
    order: 400,
    show: !!(showPresenceSettings && dndStatus && userStatus),
  }, {
    id: 'logging',
    type: 'group',
    name: getLoggingGroupName(showAutoLog, showAutoLogSMS),
    order: 500,
    dataSign: 'logging',
    items: [{
      id: 'autoLogCalls',
      type: 'switch',
      name: 'autoLogCalls',
      dataSign: 'AutoLogCall',
      show: showAutoLog,
      customTitle: autoLogTitle,
      disabled: disableAutoLogEnabled,
      checked: autoLogEnabled,
      onChange: onAutoLogChange,
      order: 3000,
      readOnly: autoLogReadOnly,
      readOnlyReason: autoLogReadOnlyReason,
    }, {
      id: 'autoLogSMS',
      type: 'switch',
      name: 'autoLogSMS',
      dataSign: 'AutoLogSMS',
      customTitle: autoLogSMSTitle,
      show: showAutoLogSMS,
      disabled: disableAutoLogSMSEnabled,
      checked: autoLogSMSEnabled,
      onChange: onAutoLogSMSChange,
      order: 4000,
      readOnly: autoLogSMSReadOnly,
      readOnlyReason: autoLogSMSReadOnlyReason,
    }],
  }, {
    id: 'feedback',
    type: 'link',
    name: 'feedback',
    onClick: onFeedbackSettingsLinkClick,
    show: showFeedback,
    order: 10000,
    dataSign: 'feedback',
  }, {
    id: 'theme',
    type: 'link',
    name: 'Theme',
    onClick: onThemeSettingsLinkClick,
    show: showThemeSetting,
    order: 11000,
    dataSign: 'theme',
  }];
  thirdPartySettings.forEach((item, index) => {
    const settingItem = getSettingItemFromThirdPartyItem({
      item,
      gotoThirdPartySection,
      onThirdPartyButtonClick,
      onSettingToggle,
      order: 8000 + index,
    });
    if (!settingItem) {
      return;
    }
    if (item.type !== 'group' && typeof item.groupId !== 'undefined') {
      const groupItem = settingsItems.find(
        (groupItem) => groupItem.id === item.groupId && groupItem.type === 'group',
      );
      if (groupItem) {
        if (!groupItem.items) {
          groupItem.items = [];
        }
        groupItem.items.push(settingItem);
        return;
      }
    }
    settingsItems.push(settingItem);
  });
  settingsItems = settingsItems.sort((a, b) => a.order - b.order);
  return (
    <BasePanel
      {...{
        currentLocale,
        className,
        showSpinner,
        showHeader,
        eulaLabel,
        eulaLink,
        onEulaLinkClick,
        loginNumber,
        onLogoutButtonClick,
        version,
        versionContainer,
      }}
    >
      {
        thirdPartyAuth ? (
          <AuthSettingsSection
            serviceName={thirdPartyAuth.serviceName}
            serviceInfo={thirdPartyAuth.serviceInfo}
            authorized={thirdPartyAuth.authorized}
            authorizedTitle={thirdPartyAuth.authorizedTitle}
            unauthorizedTitle={thirdPartyAuth.unauthorizedTitle}
            contactSyncing={thirdPartyAuth.contactSyncing}
            authorizationLogo={thirdPartyAuth.authorizationLogo}
            authorizedAccount={thirdPartyAuth.authorizedAccount}
            showAuthRedDot={thirdPartyAuth.showAuthRedDot}
            onAuthorize={onThirdPartyAuthorize}
          />
        ) : null
      }
      {
        settingsItems.map((item) => {
          if (item.type === 'presence' && item.show) {
            return (
              <PresenceSettingSection
                key={item.id}
                dndStatus={dndStatus}
                userStatus={userStatus}
                currentLocale={currentLocale}
                isCallQueueMember={isCallQueueMember}
                setAvailable={setAvailable}
                setBusy={setBusy}
                setDoNotDisturb={setDoNotDisturb}
                setInvisible={setInvisible}
                toggleAcceptCallQueueCalls={toggleAcceptCallQueueCalls}
                showPresenceSettings={openPresenceSettings}
              />
            );
          }
          return (
            <ItemRenderer
              key={item.id}
              item={item}
              currentLocale={currentLocale}
            />
          )
        })
      }
      {children}
      {additional}
    </BasePanel>
  );
};
