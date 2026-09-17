import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  TextField,
  Switch,
  Select,
  Option,
  FormField,
  FormLabel,
  Icon,
  MenuItemText,
} from '@ringcentral/spring-ui';
import { CaretDownMd } from '@ringcentral/spring-icon';
import React, { useCallback, useMemo } from 'react';

import type { LoginTypes } from '../../enums';
import type { SessionConfigProps } from './SessionConfig.interface';
import i18n from './i18n';

/**
 * SessionConfig - Reusable session configuration form component
 * Provides skill profile, inbound queues, dial group, voice connection,
 * and auto answer configuration options using Spring UI components
 */
function SessionConfig({
  skillProfileList = [],
  selectedSkillProfileId,
  onSkillProfileChange,
  showSkillProfile = false,
  inboundQueues = [],
  selectedInboundQueueIds = [],
  onInboundQueuesChange,
  showInboundQueues = false,
  showInboundQueuesPanel = false,
  onShowInboundQueuesPanelChange,
  dialGroups = [],
  dialGroupId,
  onDialGroupChange,
  showDialGroup = false,
  autoAnswer = false,
  onAutoAnswerChange,
  showAutoAnswer = false,
  loginTypeList = [],
  loginType,
  onLoginTypeChange,
  showVoiceConnection = false,
  extensionNumber = '',
  onExtensionNumberChange,
  showExtensionNumber = false,
}: SessionConfigProps) {
  const { t } = useLocale(i18n);

  const handleSkillProfileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSkillProfileChange?.(e.target.value);
    },
    [onSkillProfileChange],
  );

  const handleDialGroupChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDialGroupChange?.(e.target.value);
    },
    [onDialGroupChange],
  );

  const handleLoginTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onLoginTypeChange?.(e.target.value as LoginTypes);
    },
    [onLoginTypeChange],
  );

  const handleAutoAnswerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onAutoAnswerChange?.(e.target.checked);
    },
    [onAutoAnswerChange],
  );

  const handleExtensionNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onExtensionNumberChange?.(e.target.value);
    },
    [onExtensionNumberChange],
  );

  const handleOpenQueuesPanel = useCallback(() => {
    onShowInboundQueuesPanelChange?.(true);
  }, [onShowInboundQueuesPanelChange]);

  const inboundQueuesFieldText = useMemo(() => {
    if (selectedInboundQueueIds.length === 0) {
      return t('none');
    }
    return `${t('multipleAssignments')} (${inboundQueues.length})`;
  }, [selectedInboundQueueIds, inboundQueues.length, t]);

  // Add "None" option to dial groups only if there isn't one already
  const dialGroupOptions = useMemo(() => {
    const hasNoneOption = dialGroups.some((group) => !group.groupId);
    if (hasNoneOption) {
      return dialGroups;
    }
    const noneOption = { groupId: '', groupName: t('none'), groupDesc: '' };
    return [noneOption, ...dialGroups];
  }, [dialGroups, t]);

  // Render value for dial group select
  const renderDialGroupValue = useCallback(
    (value: string | number) => {
      const selected = dialGroupOptions.find((g) => g.groupId === value);
      if (!selected?.groupId) return t('none');
      return `${selected.groupId} - ${selected.groupName}`;
    },
    [dialGroupOptions, t],
  );

  // Don't render form when inbound queues panel is shown
  if (showInboundQueuesPanel) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Inbound Queues */}
      {showInboundQueues && inboundQueues.length > 0 && (
        <FormField
          label={t('inboundQueues')}
          variant="outlined"
          size="large"
          contentProps={{ 'data-sign': 'inboundQueues' }}
        >
          <div
            className="flex items-center justify-between w-full cursor-pointer sui-select-value"
            onClick={handleOpenQueuesPanel}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleOpenQueuesPanel();
              }
            }}
          >
            <span className="truncate">{inboundQueuesFieldText}</span>
            <Icon symbol={CaretDownMd} size="medium" />
          </div>
        </FormField>
      )}
      {/* Skill Profile */}
      {showSkillProfile && skillProfileList.length > 0 && (
        <Select
          data-sign="skillProfile"
          label={t('skillProfile')}
          value={selectedSkillProfileId || ''}
          onChange={handleSkillProfileChange}
          variant="outlined"
          size="large"
          renderValue={(value) => {
            const selected = skillProfileList.find((p) => p.profileId === value);
            if (!selected?.profileId) return t('none');
            return selected.profileName;
          }}
        >
          {skillProfileList.map((profile) => (
            <Option key={profile.profileId} value={profile.profileId}>
              <MenuItemText>{profile.profileName}</MenuItemText>
            </Option>
          ))}
        </Select>
      )}
      {/* Dial Group */}
      {showDialGroup && (
        <Select
          data-sign="dialGroup"
          label={t('dialGroup')}
          value={dialGroupId || ''}
          onChange={handleDialGroupChange}
          variant="outlined"
          size="large"
          placeholder={t('none')}
          renderValue={renderDialGroupValue}
        >
          {dialGroupOptions.map((group) => (
            <Option key={group.groupId || 'none'} value={group.groupId}>
              {group.groupId ? (
                <div className="flex flex-col">
                  <span className="typography-mainText text-neutral-b1">
                    {group.groupName}
                  </span>
                  <span className="typography-descriptor text-neutral-b2">
                    {`ID: ${group.groupId} description: ${group.groupDesc}`}
                  </span>
                </div>
              ) : (
                t('none')
              )}
            </Option>
          ))}
        </Select>
      )}
      {/* Voice Connection */}
      {showVoiceConnection && loginTypeList.length > 0 && (
        <Select
          data-sign="loginType"
          label={t('voiceConnection')}
          value={(loginType as string) || ''}
          onChange={handleLoginTypeChange}
          variant="outlined"
          size="large"
          renderValue={(value) => {
            const selected = loginTypeList.find((t) => t.id === value);
            if (!selected?.id) return t('none');
            return selected.label;
          }}
        >
          {loginTypeList.map((type) => (
            <Option key={type.id} value={type.id}>
              {type.label}
            </Option>
          ))}
        </Select>
      )}
      {/* Extension Number */}
      {showExtensionNumber && (
        <TextField
          label={t('extensionNumber')}
          value={extensionNumber}
          onChange={handleExtensionNumberChange}
          placeholder={t('enterYourPhoneNumber')}
          variant="outlined"
          size="large"
          fullWidth
          clearBtn={false}
          inputProps={{
            maxLength: 255,
            'data-sign': 'extensionNumber',
          }}
        />
      )}
      {/* Auto Answer */}
      {showAutoAnswer && (
        <FormLabel
          label={t('autoAnswer')}
          placement="start"
          fullWidth
        >
          <Switch
            checked={autoAnswer}
            onChange={handleAutoAnswerChange}
            data-sign="autoAnswer"
          />
        </FormLabel>
      )}
    </div>
  );
}

export { SessionConfig };
