import type { FunctionComponent } from 'react';
import React from 'react';

import type { SettingsPanelProps } from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import { BasePanel } from './BasePanel';

import { PresenceSettingSection } from './PresenceSettingSection';
import {
  LinkLineItem,
  SwitchLineItem,
  OptionSettingLineItem,
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
  value?: boolean | string;
  order?: number;
  groupId?: string;
  items?: ThirdPartySetting[];
  uri?: string;
  readOnly?: boolean;
  readOnlyReason?: string;
  description?: string;
  warning?: string;
  options?: {
    id: string;
    name: string;
  }[];
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
  warning?: string;
  value?: string | number;
  options?: {
    id: string;
    name: string;
  }[];
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
    showAuthButton?: boolean;
    licenseStatus?: string;
    licenseStatusColor?: string;
    licenseDescription?: string;
  } | null;
  onThirdPartyAuthorize?: () => void;
  onThirdPartyLicenseRefresh?: () => void;
  disableAutoLogSMSEnabled?: boolean;
  thirdPartySettings?: ThirdPartySetting[];
  gotoThirdPartySection: (id: string) => void;
  onThirdPartyButtonClick: (id: string) => void;
  onThirdPartySettingChanged: (setting: any, newValue: string | number | boolean) => void;
  autoLogDescription?: string;
  autoLogReadOnly?: boolean;
  autoLogReadOnlyReason?: string;
  autoLogSMSDescription?: string;
  autoLogWarning?: string;
  autoLogSMSReadOnly?: boolean;
  autoLogSMSReadOnlyReason?: string;
  showThemeSetting?: boolean;
  onThemeSettingsLinkClick?: () => void;
  showSmartNoteSetting?: boolean;
  smartNoteEnabled?: boolean;
  onSmartNoteToggle: () => void;
  smartNoteAutoStartEnabled?: boolean;
  onSmartNoteAutoStartToggle: () => void;
  smartNoteEnabledReadOnly?: boolean;
  smartNoteAutoStartEnabledReadOnly?: boolean;
  smartNoteEnabledReadOnlyReason?: string;
  smartNoteAutoStartEnabledReadOnlyReason?: string;
  gotoCallQueuePresenceSettings: () => void;
  showCallQueuePresenceSettings: boolean;
  showText: boolean;
  onTextSettingsLinkClick: () => void;
  gotoVoicemailDropSettings: () => void;
  showVoicemailDropSettings: boolean;
  showPhoneNumberFormatSettings: boolean;
  gotoPhoneNumberFormatSettings: () => void;
  showHUDSettings: boolean;
  hudEnabled: boolean;
  onHUDSettingsToggle: () => void;
  ringSenseLicensed: boolean;
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
        warning={item.warning}
      />
    );
  }
  if (item.type === 'selection') {
    return (
      <OptionSettingLineItem
        show={item.show}
        name={item.name}
        customTitle={item.customTitle}
        dataSign={item.dataSign}
        currentLocale={currentLocale}
        disabled={item.disabled}
        options={item.options}
        value={item.value}
        onChange={item.onChange}
        readOnly={item.readOnly}
        readOnlyReason={item.readOnlyReason}
        description={item.description}
        warning={item.warning}
      />
    )
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
        currentLocale={currentLocale}
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
  onThirdPartySettingChanged,
  order,
}: {
  item: ThirdPartySetting,
  gotoThirdPartySection: (id: string) => void,
  onThirdPartyButtonClick: (id: string) => void,
  onThirdPartySettingChanged: (setting: ThirdPartySetting, newValue: string | number | boolean) => void,
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
      checked: item.value as boolean,
      show: true,
      onChange: (newValue) => onThirdPartySettingChanged(item, newValue),
      order,
      readOnly: item.readOnly,
      readOnlyReason: item.readOnlyReason,
      description: item.description,
      warning: item.warning,
    };
  }
  if (item.type === 'option') {
    return {
      type: 'selection',
      id: item.id || item.name,
      name: item.name,
      customTitle: item.name,
      dataSign: `thirdPartySettings-${item.id || item.name}`,
      value: item.value as string,
      options: item.options,
      show: true,
      onChange: (newValue) => onThirdPartySettingChanged(item, newValue),
      order,
      readOnly: item.readOnly,
      readOnlyReason: item.readOnlyReason,
      description: item.description,
      warning: item.warning,
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
        onThirdPartySettingChanged,
        order: subItem.order || 0,
      })),
      dataSign: item.id || item.name,
      description: item.description,
    };
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

function getExistingGroupItem(settingsItems: SettingItem[], groupId) {
  for (const item of settingsItems) {
    if (item.id === groupId && item.type === 'group') {
      return item;
    }
    if (item.items) {
      const existingGroupItem = getExistingGroupItem(item.items, groupId);
      if (existingGroupItem) {
        return existingGroupItem;
      }
    }
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
  autoLogSMSDescription,
  autoLogSMSReadOnly = false,
  autoLogSMSReadOnlyReason = '',
  autoLogWarning,
  autoLogTitle,
  autoLogDescription,
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
  onThirdPartyLicenseRefresh,
  thirdPartySettings = [],
  gotoThirdPartySection,
  onThirdPartyButtonClick,
  onThirdPartySettingChanged,
  onThemeSettingsLinkClick,
  showThemeSetting,
  showSmartNoteSetting = false,
  smartNoteEnabled = false,
  smartNoteAutoStartEnabled = false,
  smartNoteEnabledReadOnly = false,
  smartNoteEnabledReadOnlyReason = '',
  smartNoteAutoStartEnabledReadOnly = false,
  smartNoteAutoStartEnabledReadOnlyReason = '',
  onSmartNoteToggle,
  onSmartNoteAutoStartToggle,
  gotoCallQueuePresenceSettings,
  showCallQueuePresenceSettings,
  showText,
  onTextSettingsLinkClick,
  gotoVoicemailDropSettings,
  showVoicemailDropSettings,
  gotoPhoneNumberFormatSettings,
  showPhoneNumberFormatSettings,
  showHUDSettings,
  hudEnabled,
  onHUDSettingsToggle,
  ringSenseLicensed = false,
}) => {
  let settingsItems: SettingItem[] = [{
    type: 'group',
    id: 'general',
    name: 'general',
    dataSign: 'general',
    order: 100,
    items: [{
      type: 'link',
      id: 'region',
      name: 'region',
      dataSign: 'region',
      description: 'Select the country code used for local dialing and phone number formatting.',
      show: showRegion,
      onClick: onRegionSettingsLinkClick,
      order: 200,
    }, {
      id: 'appearance',
      type: 'group',
      name: 'appearance',
      dataSign: 'appearance',
      order: 300,
      items: [{
        id: 'theme',
        type: 'link',
        name: 'theme',
        description: 'Switch between light and dark themes',
        onClick: onThemeSettingsLinkClick,
        show: showThemeSetting,
        order: 300,
        dataSign: 'theme',
      }, {
        type: 'link',
        id: 'phoneNumberFormat',
        name: 'phoneNumberFormat',
        description: 'Select phone number format',
        onClick: gotoPhoneNumberFormatSettings,
        show: showPhoneNumberFormatSettings,
        order: 400,
      }],
    }]
  }, {
    type: 'group',
    id: 'phone',
    name: 'phone',
    dataSign: 'phone',
    order: 150,
    items: [
      {
        type: 'link',
        id: 'calling',
        name: 'calling',
        description: 'Your preferred device when making/receiving calls',
        dataSign: 'calling',
        show: showCalling,
        onClick: onCallingSettingsLinkClick,
        order: 100,
      }, {
        type: 'link',
        id: 'text',
        name: 'text',
        description: 'Your preferred phone number when sending texts',
        dataSign: 'text',
        show: showText,
        onClick: onTextSettingsLinkClick,
        order: 200,
      },
      {
        id: 'voicemailDropSettings',
        type: 'link',
        name: 'voicemailDropSettings',
        description: 'Configure voicemail drop messages',
        dataSign: 'voicemailDropSettings',
        show: showVoicemailDropSettings,
        onClick: gotoVoicemailDropSettings,
        order: 300,
      },
      //   {
      //   id: 'smartNote',
      //   type: 'switch',
      //   name: 'aiAssistant',
      //   description: 'Show AI assistant widget during a call',
      //   dataSign: 'AIAssistantWidget',
      //   show: showSmartNoteSetting,
      //   checked: smartNoteEnabled,
      //   onChange: onSmartNoteToggle,
      //   readOnly: smartNoteEnabledReadOnly,
      //   readOnlyReason: smartNoteEnabledReadOnlyReason,
      //   order: 10,
      // }, 
      {
        id: 'smartNoteAutoStart',
        type: 'switch',
        name: 'autoStartAiAssistant',
        description: 'Start AI assistant automatically at call start',
        dataSign: 'AIAssistantAutoStart',
        show: showSmartNoteSetting && smartNoteEnabled,
        checked: smartNoteAutoStartEnabled,
        onChange: onSmartNoteAutoStartToggle,
        readOnly: smartNoteAutoStartEnabledReadOnly,
        readOnlyReason: smartNoteAutoStartEnabledReadOnlyReason,
        order: 400,
      }, {
        id: 'hudSettings',
        type: 'switch',
        name: 'hud',
        description: 'Monitor contacts, view their presence status, and call or text them.',
        dataSign: 'hudSettings',
        show: showHUDSettings,
        checked: hudEnabled,
        onChange: onHUDSettingsToggle,
        order: 500,
      }
    ],
  }, {
    type: 'link',
    id: 'audio',
    name: 'audio',
    dataSign: 'audio',
    show: showAudio,
    onClick: onAudioSettingsLinkClick,
    order: 200,
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
      description: autoLogDescription || 'Automatically log calls when they end in this app',
      dataSign: 'AutoLogCall',
      show: showAutoLog,
      customTitle: autoLogTitle,
      disabled: disableAutoLogEnabled,
      checked: autoLogEnabled,
      onChange: onAutoLogChange,
      order: 3000,
      readOnly: autoLogReadOnly,
      readOnlyReason: autoLogReadOnlyReason,
      warning: autoLogWarning,
    }, {
      id: 'autoLogSMS',
      type: 'switch',
      name: 'autoLogSMS',
      description: autoLogSMSDescription || 'Automatically log SMS when they are sent or received in this app',
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
    id: 'advancedFeatures',
    type: 'group',
    name: 'advanced',
    dataSign: 'advanced',
    order: 11000,
    items: [],
  }];
  thirdPartySettings.forEach((item, index) => {
    const settingItem = getSettingItemFromThirdPartyItem({
      item,
      gotoThirdPartySection,
      onThirdPartyButtonClick,
      onThirdPartySettingChanged,
      order: 8000 + index,
    });
    if (!settingItem) {
      return;
    }
    if (typeof item.groupId !== 'undefined') {
      const groupItem = getExistingGroupItem(settingsItems, item.groupId);
      if (groupItem) {
        if (!groupItem.items) {
          groupItem.items = [];
        }
        groupItem.items.push(settingItem);
        return;
      }
    }
    if (settingItem.type === 'group') {
      const existingGroupItem = getExistingGroupItem(settingsItems, settingItem.id);
      if (existingGroupItem) {
        if (settingItem.name) {
          existingGroupItem.name = settingItem.name;
        }
        if (settingItem.description) {
          existingGroupItem.description = settingItem.description;
        }
        if (settingItem.order) {
          existingGroupItem.order = settingItem.order;
        }
        if (settingItem.items && settingItem.items.length > 0) {
          existingGroupItem.items = existingGroupItem.items.concat(
            settingItem.items,
          ).sort((a, b) => a.order - b.order);
        }
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
        ringSenseLicensed,
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
            showAuthButton={thirdPartyAuth.showAuthButton}
            licenseStatus={thirdPartyAuth.licenseStatus}
            licenseStatusColor={thirdPartyAuth.licenseStatusColor}
            licenseDescription={thirdPartyAuth.licenseDescription}
            onAuthorize={onThirdPartyAuthorize}
            onLicenseRefresh={onThirdPartyLicenseRefresh}
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
                showCallQueuePresenceSettings={showCallQueuePresenceSettings}
                gotoCallQueuePresenceSettings={gotoCallQueuePresenceSettings}
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
