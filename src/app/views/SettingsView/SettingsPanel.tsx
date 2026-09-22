import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Section } from '@ringcentral-integration/micro-setting/src/app/components/Section';
import type {
  OpenEntityFromType,
  SettingsViewPanelProps,
} from '@ringcentral-integration/micro-setting/src/app/views/SettingsView';
import { ClickToDial } from '@ringcentral-integration/micro-setting/src/app/views/SettingsView/SettingsPanel/ClickToDial';
import { PresenceSetting } from '@ringcentral-integration/micro-setting/src/app/views/SettingsView/SettingsPanel/PresenceSetting';
import { SelectToDial } from '@ringcentral-integration/micro-setting/src/app/views/SettingsView/SettingsPanel/SelectToDial';
import i18n from '@ringcentral-integration/micro-setting/src/app/views/SettingsView/SettingsPanel/i18n';
import {
  Eula,
  Line,
  LinkLine,
  RemoveMeetingWarn,
  SelectLine,
  SwitchLine,
} from '@ringcentral-integration/next-widgets/components';
import { InfoMd, RefreshMd } from '@ringcentral/spring-icon';
import {
  Button,
  CircularProgressIndicator,
  IconButton,
  Tooltip,
} from '@ringcentral/spring-ui';
import clsx from 'clsx';
import type { FunctionComponent, ReactNode } from 'react';
import React from 'react';
import { noop } from 'rxjs';

import { ThirdPartySettings } from '../../components/ThirdPartySettings/ThirdPartySettings';
import type { ThirdPartySetting } from '../../services/ThirdParty';

import appI18n from './i18n';
import { SettingsGroup } from './SettingsGroup';

const EMBEDDED_THIRD_PARTY_GROUP_IDS = [
  'advancedFeatures',
  'appearance',
  'general',
  'logging',
  'phone',
  'support',
] as const;

const LEGACY_GROUP_ORDER = {
  general: 100,
  phone: 150,
  audio: 200,
  presence: 400,
  logging: 500,
  analytics: 600,
  advanced: 11000,
} as const;

interface EmbeddableSettingsPanelProps extends SettingsViewPanelProps {
  additionalPhoneItems?: ReactNode;
  autoLogDescription?: string;
  autoLogReadOnlyReason?: string;
  autoLogSMSDescription?: string;
  autoLogSMSReadOnlyReason?: string;
  autoLogWarning?: string;
  hasAdditionalPhoneItems?: boolean;
  onApplicationLogsLinkClick?: () => void;
  thirdPartyAuthSettings?: ReactNode;
  thirdPartySettings?: readonly ThirdPartySetting[];
  onThirdPartyButtonClick?: (buttonId: string) => void;
  onThirdPartySectionClick?: (sectionId: string) => void;
  onThirdPartySettingChange?: (
    setting: ThirdPartySetting,
    value: unknown,
  ) => void;
}

function hasRenderableContent(node: ReactNode): boolean {
  if (
    node === null ||
    typeof node === 'undefined' ||
    typeof node === 'boolean'
  ) {
    return false;
  }
  if (typeof node === 'string') {
    return node.length > 0;
  }
  if (Array.isArray(node)) {
    return node.some(hasRenderableContent);
  }
  if (
    React.isValidElement<{ children?: ReactNode }>(node) &&
    node.type === React.Fragment
  ) {
    return hasRenderableContent(node.props.children);
  }
  return true;
}

function hasThirdPartyGroupSettings(
  settings: readonly ThirdPartySetting[],
  groupId: string,
): boolean {
  return settings.some(
    (setting) =>
      setting.groupId === groupId ||
      (setting.type === 'group' &&
        setting.id === groupId &&
        Boolean(setting.items?.length)),
  );
}

function getThirdPartyGroupSettingCount(
  settings: readonly ThirdPartySetting[],
  groupId: string,
): number {
  return settings.reduce((count, setting) => {
    if (setting.groupId === groupId) {
      return count + 1;
    }
    if (setting.type === 'group' && setting.id === groupId) {
      return count + (setting.items?.length ?? 0);
    }
    return count;
  }, 0);
}

function getThirdPartyGroupLabel({
  settings,
  groupId,
  defaultName,
  fallbackLabel,
}: {
  settings: readonly ThirdPartySetting[];
  groupId: string;
  defaultName: string;
  fallbackLabel: string;
}): string {
  const group = settings.find(
    (setting) => setting.type === 'group' && setting.id === groupId,
  );
  if (!group?.name || group.name === defaultName) {
    return fallbackLabel;
  }
  return group.name;
}

const LoadingIcon: FunctionComponent = () => (
  <CircularProgressIndicator size="xsmall" />
);

/**
 * Renders the Spring settings panel with an app-owned Phone-group extension.
 */
export const SettingsPanel: FunctionComponent<EmbeddableSettingsPanelProps> = ({
  additional,
  additionalPhoneItems,
  hasAdditionalPhoneItems = false,
  autoLogEnabled = false,
  autoLogNotesEnabled = false,
  autoLogSMSEnabled = false,
  autoLogDescription,
  autoLogReadOnlyReason,
  autoLogSMSDescription,
  autoLogSMSReadOnlyReason,
  autoLogSMSTitle,
  autoLogTitle,
  autoLogWarning,
  children,
  className,
  crmService,
  onSelectToDialChange,
  selectToDialTitle,
  selectToDialEnabled = false,
  clickToDialEnabled = false,
  clickToCallPermission = false,
  clickToDialTitle,
  disableAutoLogEnabled = false,
  disableAutoLogNotesEnabled = false,
  disableAutoLogSMSEnabled = false,
  dndStatus,
  eulaLabel,
  eulaLink,
  onEulaLinkClick,
  privacyNoticeLabel,
  privacyNoticeLink,
  isCallQueueMember = false,
  logSMSContentEnabled = true,
  logExtCallEnabled = false,
  logSMSContentTitle,
  logExtCallTitle,
  openEntityFrom,
  onAudioSettingsLinkClick,
  onAutoLogChange = noop,
  onAutoLogNotesChange = noop,
  onAutoLogSMSChange,
  onLogExtCallChange = noop,
  onOpenEntityFromChange = noop,
  onCallingSettingsLinkClick,
  onClickToDialChange,
  onFeedbackSettingsLinkClick,
  onApplicationLogsLinkClick = noop,
  showThemeSwitch = false,
  onThemeSwitchClick,
  onLogoutButtonClick,
  onLogSMSContentChange = noop,
  onQuickAccessLinkClick = noop,
  onRegionSettingsLinkClick,
  onReportLinkClick = noop,
  onShareIdeaClick,
  onUserGuideClick,
  onReportIssueClick,
  openPresenceSettings = false,
  outboundSMS = false,
  setAvailable = noop,
  setBusy = noop,
  setDoNotDisturb = noop,
  setInvisible = noop,
  showAudio = false,
  showAutoLog = false,
  showLogExtCall = false,
  showAutoLogNotes = false,
  showAutoLogSMS = false,
  showCalling = false,
  showConsentManagement = false,
  showClickToDial = false,
  showSelectToDial = false,
  showFeedback = false,
  showLogSMSContent = false,
  showPresenceSettings = true,
  showQuickAccess = false,
  showRegion = false,
  showReport = false,
  showOpenEntityFrom = false,
  showShareIdea = false,
  showUserGuide = false,
  isEnablePendo = false,
  showReportIssue = false,
  openEntityFromOptions = [],
  toggleAcceptCallQueueCalls = noop,
  userStatus,
  version,
  versionContainer,
  showRemoveMeetingWarning,
  showMatchesToggle,
  showMatches,
  onToggleShowMatches,
  showPopUpForInboundCall,
  popUpAppForInboundCall,
  onTogglePopUpAppForInboundCall,
  additionalLogItems,
  additionalAnalytics,
  brandConfig,
  enableAcceptQueueCallsControl = true,
  customRenderInfo,
  onCallQueueManagementClick,
  onConsentManagementClick,
  autoLogTextUpdating,
  onRefreshLog,
  isLogRefreshing,
  thirdPartyAuthSettings,
  thirdPartySettings = [],
  onThirdPartyButtonClick = noop,
  onThirdPartySectionClick = noop,
  onThirdPartySettingChange = noop,
}) => {
  const { t } = useLocale(i18n);
  const { t: appT } = useLocale(appI18n);
  const hasThirdPartyPhoneSettings = hasThirdPartyGroupSettings(
    thirdPartySettings,
    'phone',
  );
  const hasThirdPartyLogSettings = hasThirdPartyGroupSettings(
    thirdPartySettings,
    'logging',
  );
  const thirdPartyAppearanceSettingCount = getThirdPartyGroupSettingCount(
    thirdPartySettings,
    'appearance',
  );
  const hasThirdPartyAppearanceSettings =
    thirdPartyAppearanceSettingCount > 0;
  const appearanceSettingCount =
    thirdPartyAppearanceSettingCount + (showThemeSwitch ? 1 : 0);
  const hasThirdPartyAdvancedSettings = hasThirdPartyGroupSettings(
    thirdPartySettings,
    'advancedFeatures',
  );
  const phoneGroupLabel = getThirdPartyGroupLabel({
    settings: thirdPartySettings,
    groupId: 'phone',
    defaultName: 'phone',
    fallbackLabel: t('phone'),
  });
  const logGroupLabel = getThirdPartyGroupLabel({
    settings: thirdPartySettings,
    groupId: 'logging',
    defaultName: 'logging',
    fallbackLabel: t('log'),
  });
  const generalGroupLabel = getThirdPartyGroupLabel({
    settings: thirdPartySettings,
    groupId: 'general',
    defaultName: 'general',
    fallbackLabel: t('general'),
  });
  const appearanceGroupLabel = getThirdPartyGroupLabel({
    settings: thirdPartySettings,
    groupId: 'appearance',
    defaultName: 'appearance',
    fallbackLabel: appT('appearance'),
  });
  const advancedGroupLabel = getThirdPartyGroupLabel({
    settings: thirdPartySettings,
    groupId: 'advancedFeatures',
    defaultName: 'advanced',
    fallbackLabel: appT('advanced'),
  });
  const supportGroupLabel = getThirdPartyGroupLabel({
    settings: thirdPartySettings,
    groupId: 'support',
    defaultName: 'support',
    fallbackLabel: appT('support'),
  });
  const standaloneThirdPartySettingsProps = {
    excludedGroupIds: EMBEDDED_THIRD_PARTY_GROUP_IDS,
    onButtonClick: onThirdPartyButtonClick,
    onSectionClick: onThirdPartySectionClick,
    onSettingChange: onThirdPartySettingChange,
    settings: thirdPartySettings,
    showGroupLabels: true,
  } as const;
  const showPhoneSection = Boolean(
    showCalling ||
      showClickToDial ||
      showSelectToDial ||
      showMatchesToggle ||
      showPopUpForInboundCall ||
      hasAdditionalPhoneItems ||
      hasThirdPartyPhoneSettings,
  );
  const showLogSection = Boolean(
    showAutoLog ||
      showAutoLogNotes ||
      showAutoLogSMS ||
      showLogSMSContent ||
      showLogExtCall ||
      hasRenderableContent(additionalLogItems) ||
      hasThirdPartyLogSettings,
  );
  const showAnalyticsSection = Boolean(showReport || additionalAnalytics);
  return (
    <>
      <AppHeaderNav title={t('settings')}>
        <></>
      </AppHeaderNav>
      <div
        className={clsx(
          'overflow-y-auto overflow-x-hidden px-3 relative',
          className,
        )}
      >
        {showRemoveMeetingWarning && (
          <RemoveMeetingWarn brandConfig={brandConfig} hasRemoved />
        )}
        <div className="space-y-3" data-sign="phone-section">
          {thirdPartyAuthSettings ? (
            <Section data-sign="third-party-auth-settings-group">
              {thirdPartyAuthSettings}
            </Section>
          ) : null}
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            maximumOrder={LEGACY_GROUP_ORDER.general}
          />
          <Section label={generalGroupLabel} data-sign="general-settings-group">
            {showRegion ? (
              <LinkLine
                data-sign="region"
                onClick={onRegionSettingsLinkClick}
              >
                {t('region')}
              </LinkLine>
            ) : null}
            {showThemeSwitch || hasThirdPartyAppearanceSettings ? (
              <SettingsGroup
                dataSign="appearance-settings-group"
                itemCount={appearanceSettingCount}
                label={appearanceGroupLabel}
              >
                {showThemeSwitch ? (
                  <LinkLine data-sign="theme" onClick={onThemeSwitchClick}>
                    {t('theme')}
                  </LinkLine>
                ) : null}
                <ThirdPartySettings
                  groupId="appearance"
                  settings={thirdPartySettings}
                  onButtonClick={onThirdPartyButtonClick}
                  onSectionClick={onThirdPartySectionClick}
                  onSettingChange={onThirdPartySettingChange}
                />
              </SettingsGroup>
            ) : null}
            {children}
            {showOpenEntityFrom && (
              <SelectLine
                value={openEntityFrom}
                options={openEntityFromOptions}
                data-sign="openEntityFrom"
                onChange={(value: string) =>
                  onOpenEntityFromChange(value as OpenEntityFromType)
                }
              >
                {t('openEntityFrom')}
              </SelectLine>
            )}
            {additional}
            <ThirdPartySettings
              groupId="general"
              settings={thirdPartySettings}
              onButtonClick={onThirdPartyButtonClick}
              onSectionClick={onThirdPartySectionClick}
              onSettingChange={onThirdPartySettingChange}
            />
          </Section>
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            minimumOrder={LEGACY_GROUP_ORDER.general}
            maximumOrder={LEGACY_GROUP_ORDER.phone}
          />
          {showPhoneSection && (
            <Section label={phoneGroupLabel} data-sign="phone-settings-group">
              {showCalling && (
                <LinkLine
                  data-sign="calling"
                  onClick={onCallingSettingsLinkClick}
                >
                  {t('calling')}
                </LinkLine>
              )}
              <ClickToDial
                showClickToDial={showClickToDial}
                outboundSMS={outboundSMS}
                clickToCallPermission={clickToCallPermission}
                clickToDialEnabled={clickToDialEnabled}
                onClickToDialChange={onClickToDialChange}
                clickToDialTitle={clickToDialTitle}
              />
              <SelectToDial
                showSelectToDial={showSelectToDial}
                smsPermission={outboundSMS}
                callPermission={clickToCallPermission}
                selectToDialEnabled={selectToDialEnabled}
                onSelectToDialChange={onSelectToDialChange}
                selectToDialTitle={selectToDialTitle}
              />
              {showMatchesToggle && (
                <SwitchLine
                  data-sign="showMatchedEntities"
                  checked={showMatches}
                  onChange={onToggleShowMatches}
                >
                  {t('showMatches')}
                </SwitchLine>
              )}
              {showPopUpForInboundCall && (
                <SwitchLine
                  data-sign="popUpAppForInboundCall"
                  checked={popUpAppForInboundCall}
                  onChange={onTogglePopUpAppForInboundCall}
                >
                  {customRenderInfo?.popUpForInboundCall?.subject ||
                    t('popUpAppForInboundCall')}
                  {customRenderInfo?.popUpForInboundCall?.tooltip && (
                    <Tooltip
                      color="neutral"
                      placement="bottom"
                      title={customRenderInfo.popUpForInboundCall.tooltip}
                    >
                      <IconButton
                        size="medium"
                        symbol={InfoMd}
                        color="neutral"
                        variant="icon"
                        data-sign="popUpAppForInboundCall-info-icon"
                      />
                    </Tooltip>
                  )}
                </SwitchLine>
              )}
              {hasAdditionalPhoneItems ? additionalPhoneItems : null}
              {hasThirdPartyPhoneSettings ? (
                <ThirdPartySettings
                  groupId="phone"
                  settings={thirdPartySettings}
                  onButtonClick={onThirdPartyButtonClick}
                  onSectionClick={onThirdPartySectionClick}
                  onSettingChange={onThirdPartySettingChange}
                />
              ) : null}
            </Section>
          )}
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            minimumOrder={LEGACY_GROUP_ORDER.phone}
            maximumOrder={LEGACY_GROUP_ORDER.audio}
          />
          {showAudio ? (
            <Section data-sign="audio-settings-group">
              <LinkLine data-sign="audio" onClick={onAudioSettingsLinkClick}>
                {t('audio')}
              </LinkLine>
            </Section>
          ) : null}
          {showConsentManagement ? (
            <Section label={t('text')}>
              <LinkLine
                data-sign="consentManagement"
                onClick={onConsentManagementClick}
              >
                {t('consentManagement')}
              </LinkLine>
            </Section>
          ) : null}
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            minimumOrder={LEGACY_GROUP_ORDER.audio}
            maximumOrder={LEGACY_GROUP_ORDER.presence}
          />
          {showPresenceSettings && dndStatus && userStatus ? (
            <Section data-sign="presence-settings-group">
              <PresenceSetting
                dndStatus={dndStatus}
                presenceStatus={userStatus}
                isCallQueueMember={isCallQueueMember}
                setAvailable={setAvailable}
                setBusy={setBusy}
                setDoNotDisturb={setDoNotDisturb}
                setInvisible={setInvisible}
                toggleAcceptCallQueueCalls={toggleAcceptCallQueueCalls}
                showPresenceSettings={openPresenceSettings}
                enableAcceptQueueCallsControl={enableAcceptQueueCallsControl}
                onCallQueueManagementClick={onCallQueueManagementClick}
              />
            </Section>
          ) : null}
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            minimumOrder={LEGACY_GROUP_ORDER.presence}
            maximumOrder={LEGACY_GROUP_ORDER.logging}
          />
          {showLogSection && (
            <Section
              label={logGroupLabel}
              data-sign="log-settings-group"
              headerEndAdornment={
                onRefreshLog && (
                  <IconButton
                    size="xsmall"
                    iconSize="xsmall"
                    disabled={isLogRefreshing}
                    symbol={isLogRefreshing ? LoadingIcon : RefreshMd}
                    color="neutral"
                    variant="icon"
                    data-sign="refresh-log"
                    TooltipProps={
                      isLogRefreshing
                        ? undefined
                        : {
                            title: t('syncSettings'),
                          }
                    }
                    onClick={onRefreshLog}
                  />
                )
              }
            >
              {additionalLogItems}
              {hasThirdPartyLogSettings ? (
                <ThirdPartySettings
                  groupId="logging"
                  settings={thirdPartySettings}
                  onButtonClick={onThirdPartyButtonClick}
                  onSectionClick={onThirdPartySectionClick}
                  onSettingChange={onThirdPartySettingChange}
                />
              ) : null}
              {showAutoLog && (
                <SwitchLine
                  data-sign="AutoLogCall"
                  disabled={disableAutoLogEnabled}
                  checked={autoLogEnabled}
                  onChange={onAutoLogChange}
                >
                  <span className="truncate">
                    {autoLogTitle || t('autoLogCalls')}
                  </span>
                  {(autoLogReadOnlyReason ||
                    autoLogWarning ||
                    autoLogDescription) && (
                    <Tooltip
                      color="neutral"
                      placement="bottom"
                      title={
                        autoLogReadOnlyReason ||
                        autoLogWarning ||
                        autoLogDescription
                      }
                    >
                      <IconButton
                        size="medium"
                        symbol={InfoMd}
                        color="neutral"
                        variant="icon"
                        data-sign="AutoLogCall-info"
                      />
                    </Tooltip>
                  )}
                </SwitchLine>
              )}
              {showAutoLogNotes && (
                <SwitchLine
                  data-sign="AutoLogNotes"
                  disabled={disableAutoLogNotesEnabled}
                  checked={autoLogNotesEnabled}
                  onChange={onAutoLogNotesChange}
                >
                  {t('autoLogNotes')}
                </SwitchLine>
              )}
              {showAutoLogSMS && (
                <SwitchLine
                  data-sign="AutoLogSMS"
                  disabled={disableAutoLogSMSEnabled}
                  checked={autoLogSMSEnabled}
                  onChange={onAutoLogSMSChange}
                  loading={autoLogTextUpdating}
                >
                  <span className="truncate">
                    {autoLogSMSTitle || t('autoLogSMS')}
                  </span>
                  {(autoLogSMSReadOnlyReason || autoLogSMSDescription) && (
                    <Tooltip
                      color="neutral"
                      placement="bottom"
                      title={autoLogSMSReadOnlyReason || autoLogSMSDescription}
                    >
                      <IconButton
                        size="medium"
                        symbol={InfoMd}
                        color="neutral"
                        variant="icon"
                        data-sign="AutoLogSMS-info"
                      />
                    </Tooltip>
                  )}
                </SwitchLine>
              )}
              {showLogSMSContent && (
                <SwitchLine
                  data-sign="LogSMSContent"
                  checked={logSMSContentEnabled}
                  onChange={onLogSMSContentChange}
                >
                  {logSMSContentTitle || t('logSMSContent')}
                </SwitchLine>
              )}
              {showLogExtCall && (
                <SwitchLine
                  data-sign="logExtensionCall"
                  checked={logExtCallEnabled}
                  onChange={onLogExtCallChange}
                >
                  {logExtCallTitle || t('logExtensionCall')}
                </SwitchLine>
              )}
            </Section>
          )}
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            minimumOrder={LEGACY_GROUP_ORDER.logging}
            maximumOrder={LEGACY_GROUP_ORDER.analytics}
          />
          {showAnalyticsSection && (
            <Section label={t('analytics')} tag={crmService}>
              {showReport ? (
                <LinkLine data-sign="report" onClick={onReportLinkClick}>
                  {t('report')}
                </LinkLine>
              ) : null}
              {additionalAnalytics}
            </Section>
          )}
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            minimumOrder={LEGACY_GROUP_ORDER.analytics}
            maximumOrder={LEGACY_GROUP_ORDER.advanced}
          />
          {hasThirdPartyAdvancedSettings ? (
            <Section
              label={advancedGroupLabel}
              data-sign="advanced-settings-group"
            >
              <ThirdPartySettings
                groupId="advancedFeatures"
                settings={thirdPartySettings}
                onButtonClick={onThirdPartyButtonClick}
                onSectionClick={onThirdPartySectionClick}
                onSettingChange={onThirdPartySettingChange}
              />
            </Section>
          ) : null}
          <ThirdPartySettings
            {...standaloneThirdPartySettingsProps}
            minimumOrder={LEGACY_GROUP_ORDER.advanced}
          />
          <Section label={supportGroupLabel} data-sign="support-settings-group">
            <LinkLine
              data-sign="applicationLogs"
              onClick={onApplicationLogsLinkClick}
            >
              {appT('troubleshootingLogs')}
            </LinkLine>
            <ThirdPartySettings
              groupId="support"
              settings={thirdPartySettings}
              onButtonClick={onThirdPartyButtonClick}
              onSectionClick={onThirdPartySectionClick}
              onSettingChange={onThirdPartySettingChange}
            />
            {showFeedback && (
              <LinkLine
                data-sign="Feedback"
                data-pendo={isEnablePendo ? 'Feedback' : ''}
                onClick={onFeedbackSettingsLinkClick}
              >
                {t('feedback')}
              </LinkLine>
            )}
            {showShareIdea && (
              <LinkLine data-sign="shareIdea" onClick={onShareIdeaClick}>
                {t('shareIdea')}
              </LinkLine>
            )}
            {showQuickAccess && (
              <LinkLine
                data-sign="quickAccess"
                onClick={onQuickAccessLinkClick}
              >
                {t('quickAccess')}
              </LinkLine>
            )}
            {showUserGuide && (
              <LinkLine data-sign="userGuide" onClick={onUserGuideClick}>
                {t('userGuide')}
              </LinkLine>
            )}
            {showReportIssue && (
              <LinkLine data-sign="reportIssue" onClick={onReportIssueClick}>
                {t('reportIssue')}
              </LinkLine>
            )}
            {versionContainer || (
              <Line
                data-sign="version"
                className="flex justify-between"
                icon={<span className="typography-mainText">{version}</span>}
              >
                {t('version')}
              </Line>
            )}
            <Line>
              <Eula
                data-sign="eula"
                link={eulaLink!}
                label={eulaLabel}
                onClick={onEulaLinkClick}
              />
            </Line>
            {privacyNoticeLink && privacyNoticeLabel && (
              <Line>
                <Eula
                  data-sign="privacyNotice"
                  link={privacyNoticeLink}
                  label={privacyNoticeLabel}
                />
              </Line>
            )}
          </Section>
        </div>
        <div className="p-3 flex justify-center">
          <Button
            data-sign="logoutButton"
            color="primary"
            variant="text"
            fullWidth
            size="medium"
            onClick={onLogoutButtonClick}
          >
            {t('logout')}
          </Button>
        </div>
      </div>
    </>
  );
};
