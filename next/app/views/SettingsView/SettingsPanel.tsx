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

interface EmbeddableSettingsPanelProps extends SettingsViewPanelProps {
  additionalPhoneItems?: ReactNode;
  hasAdditionalPhoneItems?: boolean;
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
  autoLogSMSTitle,
  autoLogTitle,
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
  showThemeSwitch = false,
  onTrackingClick,
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
  showClickToDial = false,
  showSelectToDial = false,
  showFeedback = true,
  showTrackingIssue = false,
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
  autoLogTextUpdating,
  onRefreshLog,
  isLogRefreshing,
}) => {
  const { t } = useLocale(i18n);
  const showPhoneSection = Boolean(
    showAudio ||
      showCalling ||
      showRegion ||
      showReport ||
      showMatchesToggle ||
      showPopUpForInboundCall ||
      hasAdditionalPhoneItems,
  );
  const showLogSection = Boolean(
    showAutoLog ||
      showAutoLogNotes ||
      showAutoLogSMS ||
      showLogSMSContent ||
      showLogExtCall ||
      additionalLogItems,
  );
  const showAnalyticsSection = Boolean(additionalAnalytics);
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
          {showPhoneSection && (
            <Section label={t('phone')} data-sign="phone-settings-group">
              {showReport && (
                <LinkLine data-sign="report" onClick={onReportLinkClick}>
                  {t('report')}
                </LinkLine>
              )}
              {showCalling && (
                <LinkLine
                  data-sign="calling"
                  onClick={onCallingSettingsLinkClick}
                >
                  {t('calling')}
                </LinkLine>
              )}
              {showAudio && (
                <LinkLine data-sign="audio" onClick={onAudioSettingsLinkClick}>
                  {t('audio')}
                </LinkLine>
              )}
              {showRegion && (
                <LinkLine
                  data-sign="region"
                  onClick={onRegionSettingsLinkClick}
                >
                  {t('region')}
                </LinkLine>
              )}
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
            </Section>
          )}
          {showLogSection && (
            <Section
              label={t('log')}
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
              {showAutoLog && (
                <SwitchLine
                  data-sign="AutoLogCall"
                  disabled={disableAutoLogEnabled}
                  checked={autoLogEnabled}
                  onChange={onAutoLogChange}
                >
                  {autoLogTitle || t('autoLogCalls')}
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
                  {autoLogSMSTitle || t('autoLogSMS')}
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
          {showAnalyticsSection && (
            <Section label={t('analytics')} tag={crmService}>
              {additionalAnalytics}
            </Section>
          )}
          <Section label={t('general')} data-sign="general-settings-group">
            {showPresenceSettings && dndStatus && userStatus && (
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
            )}
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
            {additional}
            {showThemeSwitch && (
              <LinkLine data-sign="theme" onClick={onThemeSwitchClick}>
                {t('theme')}
              </LinkLine>
            )}
            {showTrackingIssue && (
              <LinkLine data-sign="ContactSupport" onClick={onTrackingClick}>
                {t('contactSupport')}
              </LinkLine>
            )}
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
          </Section>
          <Section>
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
