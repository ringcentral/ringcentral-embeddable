import { AppFooterNav } from '@ringcentral-integration/micro-core/src/app/components/AppContext/AppFooter';
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components/AppContext/AppHeader';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-spring-page';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { InfoMd, LockMd, PlusMd, TrashMd } from '@ringcentral/spring-icon';
import {
  Alert,
  Button,
  Checkbox,
  FormLabel,
  Icon,
  IconButton,
  Option,
  Select,
  Switch,
  TextField,
  Textarea,
  Tooltip,
} from '@ringcentral/spring-ui';
import clsx from 'clsx';
import type { FunctionComponent, ReactElement, ReactNode } from 'react';
import React, { useEffect, useMemo, useState } from 'react';

import type {
  ThirdPartySetting,
  ThirdPartySettingCondition,
} from '../../services/ThirdParty';

import i18n from './i18n';

interface ThirdPartySettingSectionPanelProps {
  readonly section: ThirdPartySetting;
  readonly onBack: () => void;
  readonly onSave: (section: ThirdPartySetting) => Promise<void>;
}

interface SettingInputProps {
  readonly setting: ThirdPartySetting;
  readonly onChange: (value: unknown) => void;
}

type AlertSeverity = 'error' | 'info' | 'neutral' | 'success' | 'warning';

function cloneSetting(setting: ThirdPartySetting): ThirdPartySetting {
  return JSON.parse(JSON.stringify(setting)) as ThirdPartySetting;
}

function getSettingId(setting: ThirdPartySetting): string {
  return setting.id || setting.name || '';
}

function getArrayValue(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getTextValue(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}

function getAlertSeverity(value?: string): AlertSeverity {
  if (
    value === 'error' ||
    value === 'info' ||
    value === 'neutral' ||
    value === 'success' ||
    value === 'warning'
  ) {
    return value;
  }
  return 'info';
}

function getTypographyClasses(setting: ThirdPartySetting): string {
  const typographyClasses: Record<string, string> = {
    body1: 'typography-mainText',
    body2: 'typography-descriptor',
    caption1: 'typography-descriptor',
    caption2: 'typography-label',
    display1: 'typography-display1',
    display2: 'typography-display2',
    headline1: 'typography-title',
    headline2: 'typography-subtitle',
    title1: 'typography-title',
    title2: 'typography-subtitle',
  };
  const colorClasses: Record<string, string> = {
    danger: 'text-danger',
    error: 'text-danger',
    success: 'text-success',
    warning: 'text-warning',
  };
  const colorName = setting.color?.split('.')[0] ?? '';
  return clsx(
    typographyClasses[setting.variant ?? 'body1'] ?? 'typography-mainText',
    colorClasses[colorName] ?? 'text-neutral-b0',
  );
}

function includesValue(source: unknown, value: unknown): boolean {
  if (typeof source === 'string') {
    return source.includes(String(value));
  }
  return Array.isArray(source) && source.includes(value);
}

function matchesCondition(
  inputValue: unknown,
  condition: ThirdPartySettingCondition,
): boolean {
  switch (condition.operator) {
    case 'equal':
      return inputValue === condition.value;
    case 'notEqual':
      return inputValue !== condition.value;
    case 'contains':
      return includesValue(inputValue, condition.value);
    case 'notContains':
      return !includesValue(inputValue, condition.value);
    case 'startsWith':
      return (
        typeof inputValue === 'string' &&
        inputValue.startsWith(String(condition.value))
      );
    case 'endsWith':
      return (
        typeof inputValue === 'string' &&
        inputValue.endsWith(String(condition.value))
      );
    case 'greaterThan':
      return (
        typeof inputValue === 'number' &&
        typeof condition.value === 'number' &&
        inputValue > condition.value
      );
    case 'lessThan':
      return (
        typeof inputValue === 'number' &&
        typeof condition.value === 'number' &&
        inputValue < condition.value
      );
    case 'greaterThanOrEqual':
      return (
        typeof inputValue === 'number' &&
        typeof condition.value === 'number' &&
        inputValue >= condition.value
      );
    case 'lessThanOrEqual':
      return (
        typeof inputValue === 'number' &&
        typeof condition.value === 'number' &&
        inputValue <= condition.value
      );
    default:
      return false;
  }
}

function shouldShowSetting(
  setting: ThirdPartySetting,
  settings: readonly ThirdPartySetting[],
): boolean {
  if (!setting.showWhen) {
    return true;
  }
  return Object.entries(setting.showWhen).every(([id, condition]) => {
    const input = settings.find((item) => item.id === id);
    return matchesCondition(input?.value, condition);
  });
}

function isRequiredValueFilled(value: unknown): boolean {
  return !(
    value === '' ||
    value === null ||
    typeof value === 'undefined' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function areRequiredSettingsFilled(
  settings: readonly ThirdPartySetting[],
): boolean {
  return settings.every(
    (setting) =>
      !setting.required ||
      !shouldShowSetting(setting, settings) ||
      isRequiredValueFilled(setting.value),
  );
}

function getSettingLabel(setting: ThirdPartySetting): ReactNode {
  const label = (
    <span className="inline-flex items-center gap-1">
      <span>{setting.name}</span>
      {setting.description && setting.type !== 'boolean' ? (
        <Tooltip
          color="neutral"
          placement="bottom"
          title={setting.description}
        >
          <span
            className="inline-flex text-neutral-b2"
            data-sign={`${getSettingId(setting)}-description`}
          >
            <Icon size="small" symbol={InfoMd} />
          </span>
        </Tooltip>
      ) : null}
      {setting.readOnly ? (
        <Tooltip
          color="neutral"
          placement="bottom"
          title={setting.readOnlyReason || ''}
        >
          <span
            className="inline-flex text-neutral-b2"
            data-sign={`${getSettingId(setting)}-readOnly`}
          >
            <Icon size="small" symbol={LockMd} />
          </span>
        </Tooltip>
      ) : null}
    </span>
  );
  if (setting.type !== 'boolean' || !setting.description) {
    return label;
  }
  return (
    <span className="flex min-w-0 flex-col">
      {label}
      <span className="typography-descriptor text-neutral-b2">
        {setting.description}
      </span>
    </span>
  );
}

const SettingInput: FunctionComponent<SettingInputProps> = ({
  setting,
  onChange,
}) => {
  const { t } = useLocale(i18n);
  const settingId = getSettingId(setting);
  const isDisabled = setting.disabled || setting.readOnly;
  const validOptions = (setting.options ?? []).filter(
    (option) =>
      typeof option.name === 'string' &&
      (typeof option.id === 'string' || typeof option.id === 'number'),
  );
  const label = getSettingLabel(setting);

  if (setting.type === 'boolean') {
    return (
      <FormLabel
        fullWidth
        label={label}
        placement="start"
        disabled={isDisabled}
        rootProps={{ 'data-sign': settingId }}
      >
        <Switch
          className="flex-none"
          checked={Boolean(setting.value)}
          onChange={(event) => onChange(event.target.checked)}
        />
      </FormLabel>
    );
  }
  if (setting.type === 'string') {
    return (
      <TextField
        clearBtn={false}
        data-sign={settingId}
        disabled={isDisabled}
        fullWidth
        size="large"
        helperText={setting.helper}
        label={label}
        placeholder={setting.placeholder}
        required={setting.required}
        value={getTextValue(setting.value)}
        variant="outlined"
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  if (setting.type === 'text') {
    return (
      <Textarea
        clearBtn={false}
        data-sign={settingId}
        disabled={isDisabled}
        fullWidth
        helperText={setting.helper}
        label={label}
        minRows={2}
        placeholder={setting.placeholder}
        required={setting.required}
        value={getTextValue(setting.value)}
        variant="outlined"
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  if (setting.type === 'option' && setting.checkbox) {
    const selectedValues = setting.multiple
      ? Array.isArray(setting.value)
        ? setting.value
        : []
      : [setting.value];
    return (
      <div className="flex flex-col gap-1" data-sign={settingId}>
        <div className="typography-descriptorMini text-neutral-b0">
          {label}
          {setting.required ? ' *' : ''}
        </div>
        {setting.helper ? (
          <div className="typography-descriptor text-neutral-b2">
            {setting.helper}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {validOptions.map((option) => {
            const isChecked = selectedValues.includes(option.id);
            return (
              <FormLabel
                key={option.id}
                label={option.name}
                disabled={isDisabled || option.disabled}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={(event) => {
                    if (!setting.multiple) {
                      onChange(event.target.checked ? option.id : null);
                      return;
                    }
                    onChange(
                      event.target.checked
                        ? [...selectedValues, option.id]
                        : selectedValues.filter((value) => value !== option.id),
                    );
                  }}
                />
              </FormLabel>
            );
          })}
        </div>
      </div>
    );
  }
  if (setting.type === 'option') {
    return (
      <Select
        data-sign={settingId}
        disabled={isDisabled}
        helperText={setting.helper}
        label={label}
        placeholder={setting.placeholder}
        required={setting.required}
        selectMode={setting.multiple ? 'multiple' : 'single'}
        value={setting.value}
        variant="outlined"
        size="large"
        renderValue={(value) => {
          const values = Array.isArray(value) ? value : [value];
          return values
            .map(
              (selectedValue) =>
                validOptions.find((option) => option.id === selectedValue)
                  ?.name,
            )
            .filter(Boolean)
            .join(', ');
        }}
        onChange={(event) => onChange(event.target.value)}
      >
        {validOptions.map((option) => (
          <Option key={option.id} value={option.id} disabled={option.disabled}>
            <div className="flex flex-col">
              <span>{option.name}</span>
              {option.description ? (
                <span className="typography-descriptor text-neutral-b2">
                  {option.description}
                </span>
              ) : null}
            </div>
          </Option>
        ))}
      </Select>
    );
  }
  if (setting.type === 'admonition' && typeof setting.value === 'string') {
    return (
      <Alert
        data-sign={settingId}
        severity={getAlertSeverity(setting.severity)}
      >
        <TextWithMarkdown text={setting.value} />
      </Alert>
    );
  }
  if (setting.type === 'typography' && typeof setting.value === 'string') {
    return (
      <div className={getTypographyClasses(setting)} data-sign={settingId}>
        <TextWithMarkdown text={setting.value} />
      </div>
    );
  }
  if (setting.type === 'array') {
    const values = getArrayValue(setting.value);
    const reachedMaximum =
      typeof setting.maxItems === 'number' && values.length >= setting.maxItems;
    return (
      <div className="flex flex-col gap-2" data-sign={settingId}>
        <div>
          <div className="typography-descriptorMini text-neutral-b0">
            {label}
            {setting.required ? ' *' : ''}
          </div>
          {setting.helper ? (
            <div className="typography-descriptor text-neutral-b2">
              {setting.helper}
            </div>
          ) : null}
        </div>
        {values.map((value, index) => (
          <div className="flex items-center gap-2" key={index}>
            <TextField
              clearBtn={false}
              disabled={isDisabled}
              fullWidth
              value={value}
              variant="outlined"
              size="large"
              onChange={(event) =>
                onChange(
                  values.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
            />
            {!setting.readOnly ? (
              <IconButton
                aria-label={t('delete')}
                color="neutral"
                disabled={setting.disabled}
                size="small"
                symbol={TrashMd}
                variant="icon"
                onClick={() =>
                  onChange(values.filter((_, itemIndex) => itemIndex !== index))
                }
              />
            ) : null}
          </div>
        ))}
        {!setting.readOnly ? (
          <Button
            className="self-start"
            disabled={setting.disabled || reachedMaximum}
            size="small"
            startIcon={PlusMd}
            variant="outlined"
            onClick={() => onChange([...values, ''])}
          >
            {t('add')}
          </Button>
        ) : null}
      </div>
    );
  }
  return null;
};

/** Renders an editable third-party settings section as a Spring detail page. */
export const ThirdPartySettingSectionPanel: FunctionComponent<
  ThirdPartySettingSectionPanelProps
> = ({ section, onBack, onSave }) => {
  const { t } = useLocale(i18n);
  const [draftSection, setDraftSection] = useState<ThirdPartySetting>(() =>
    cloneSetting(section),
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraftSection(cloneSetting(section));
  }, [section]);

  const settings = draftSection.items ?? [];
  const hasChanges = useMemo(
    () => JSON.stringify(draftSection.items) !== JSON.stringify(section.items),
    [draftSection.items, section.items],
  );
  const canSave = hasChanges && areRequiredSettingsFilled(settings);

  async function saveSection(): Promise<void> {
    if (!canSave || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(draftSection);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <AppHeaderNav override>
        <PageHeader onBackClick={onBack}>{section.name || ''}</PageHeader>
      </AppHeaderNav>
      <div
        className="flex flex-auto flex-col gap-4 overflow-y-auto px-4 pb-4"
        data-sign="thirdPartySettingSectionContent"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.stopPropagation();
          }
        }}
      >
        {settings.map((setting) =>
          shouldShowSetting(setting, settings) ? (
            <SettingInput
              key={getSettingId(setting)}
              setting={setting}
              onChange={(value) => {
                setDraftSection((currentSection) => ({
                  ...currentSection,
                  items: (currentSection.items ?? []).map((item) =>
                    item.id === setting.id ? { ...item, value } : item,
                  ),
                }));
              }}
            />
          ) : null,
        )}
      </div>
      <AppFooterNav>
        <div className="mt-auto flex-none border-t border-neutral-b4/50 p-3">
          <Button
            data-sign="thirdPartySettingSectionSave"
            disabled={!canSave || isSaving}
            fullWidth
            loading={isSaving}
            onClick={() => void saveSection()}
          >
            {t('save')}
          </Button>
        </div>
      </AppFooterNav>
    </div>
  );
};
