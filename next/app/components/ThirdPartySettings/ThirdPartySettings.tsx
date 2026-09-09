import { TextWithMarkdown } from '@ringcentral-integration/jsonschema-spring-page';
import { Section } from '@ringcentral-integration/micro-setting/src/app/components/Section';
import {
  Line,
  LinkLine,
  SelectLine,
  SwitchLine,
} from '@ringcentral-integration/next-widgets/components';
import { CaretDownMd, CaretUpMd, LockMd } from '@ringcentral/spring-icon';
import {
  Button,
  Icon,
  IconButton,
  Option,
  Select,
  Tooltip,
} from '@ringcentral/spring-ui';
import type { FunctionComponent, ReactElement, ReactNode } from 'react';
import React, { useState } from 'react';

import type { ThirdPartySetting } from '../../services/ThirdParty';

interface ThirdPartySettingsProps {
  readonly settings: readonly ThirdPartySetting[];
  readonly groupId?: string;
  readonly excludedGroupIds?: readonly string[];
  readonly showGroupLabels?: boolean;
  readonly minimumOrder?: number;
  readonly maximumOrder?: number;
  readonly onButtonClick: (buttonId: string) => void;
  readonly onSectionClick: (sectionId: string) => void;
  readonly onSettingChange: (
    setting: ThirdPartySetting,
    value: unknown,
  ) => void;
}

interface ThirdPartySettingRendererProps {
  readonly setting: ThirdPartySetting;
  readonly onButtonClick: (buttonId: string) => void;
  readonly onSectionClick: (sectionId: string) => void;
  readonly onSettingChange: (
    setting: ThirdPartySetting,
    value: unknown,
  ) => void;
}

interface ThirdPartySettingsSection {
  readonly id: string;
  readonly dataSign: string;
  readonly label?: string;
  readonly info?: string;
  readonly order: number;
  readonly settings: ThirdPartySetting[];
}

interface ThirdPartySettingEntry {
  readonly order: number;
  readonly setting: ThirdPartySetting;
}

const DEFAULT_CUSTOM_SETTING_ORDER = 8000;

function getSettingId(setting: ThirdPartySetting): string {
  return setting.id || setting.name || '';
}

function cloneSetting(setting: ThirdPartySetting): ThirdPartySetting {
  return {
    ...setting,
    items: setting.items?.map(cloneSetting),
  };
}

function getOrderedSettings(
  settings: readonly ThirdPartySetting[],
): ThirdPartySetting[] {
  return [...settings].sort(
    (first, second) => (first.order ?? 0) - (second.order ?? 0),
  );
}

function findGroup(
  settings: ThirdPartySetting[],
  groupId: string,
): ThirdPartySetting | undefined {
  for (const setting of settings) {
    if (setting.type === 'group' && setting.id === groupId) {
      return setting;
    }
    if (setting.items) {
      const group = findGroup(setting.items, groupId);
      if (group) {
        return group;
      }
    }
  }
  return undefined;
}

function getStandaloneSettingEntries({
  settings,
  excludedGroupIds,
}: Pick<
  ThirdPartySettingsProps,
  'settings' | 'excludedGroupIds'
>): ThirdPartySettingEntry[] {
  const result: Array<
    Pick<ThirdPartySettingEntry, 'setting'> & { registrationIndex: number }
  > = [];
  const excludedIds = new Set(excludedGroupIds);
  settings.forEach((setting, registrationIndex) => {
    if (
      (setting.groupId && excludedIds.has(setting.groupId)) ||
      (setting.type === 'group' && setting.id && excludedIds.has(setting.id))
    ) {
      return;
    }
    if (setting.groupId) {
      const group = findGroup(
        result.map((entry) => entry.setting),
        setting.groupId,
      );
      if (group) {
        group.items = [...(group.items ?? []), setting];
        return;
      }
    }
    result.push({
      registrationIndex,
      setting: cloneSetting(setting),
    });
  });
  return result
    .map(({ registrationIndex, setting }) => ({
      order: setting.order ?? DEFAULT_CUSTOM_SETTING_ORDER + registrationIndex,
      setting,
    }))
    .sort((first, second) => first.order - second.order);
}

function getGroupSettings(
  settings: readonly ThirdPartySetting[],
  groupId: string,
): ThirdPartySetting[] {
  return getOrderedSettings(
    settings.flatMap((setting) => {
      if (setting.groupId === groupId) {
        return [setting];
      }
      if (setting.type === 'group' && setting.id === groupId) {
        return setting.items ?? [];
      }
      return [];
    }),
  );
}

function getLabeledSections(
  entries: readonly ThirdPartySettingEntry[],
): ThirdPartySettingsSection[] {
  return entries.flatMap(({ order, setting }, index) => {
    if (setting.type === 'group') {
      const childSettings = getOrderedSettings(setting.items ?? []);
      if (childSettings.length === 0) {
        return [];
      }
      return [
        {
          id: `${getSettingId(setting)}-${index}`,
          dataSign: getSettingId(setting),
          label: setting.name,
          info: setting.description,
          order,
          settings: childSettings,
        },
      ];
    }
    return [
      {
        id: `third-party-settings-${index}`,
        dataSign: `third-party-settings-group-${index}`,
        order,
        settings: [setting],
      },
    ];
  });
}

function getSettingLabel(setting: ThirdPartySetting): ReactNode {
  return (
    <span className="flex min-w-0 flex-col text-left">
      <span className="truncate">{setting.name}</span>
      {setting.description ? (
        <span className="typography-descriptor text-neutral-b2 text-wrap">
          {setting.description}
        </span>
      ) : null}
      {setting.warning ? (
        <span className="typography-descriptor text-danger text-wrap">
          {setting.warning}
        </span>
      ) : null}
    </span>
  );
}

function getReadOnlyAdornment(setting: ThirdPartySetting): ReactElement | null {
  if (!setting.readOnly) {
    return null;
  }
  return (
    <Tooltip
      color="neutral"
      placement="bottom"
      title={setting.readOnlyReason || ''}
    >
      <IconButton
        size="small"
        symbol={LockMd}
        color="neutral"
        variant="icon"
        data-sign={`${getSettingId(setting)}-readOnly`}
      />
    </Tooltip>
  );
}

const ThirdPartySettingRenderer: FunctionComponent<
  ThirdPartySettingRendererProps
> = ({ setting, onButtonClick, onSectionClick, onSettingChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const settingId = getSettingId(setting);
  const validOptions = (setting.options ?? []).filter(
    (option) =>
      typeof option.name === 'string' &&
      (typeof option.id === 'string' || typeof option.id === 'number'),
  );

  if (!settingId || !setting.name || !setting.type) {
    return null;
  }
  if (setting.type === 'section') {
    return (
      <LinkLine
        data-sign={settingId}
        title={setting.description}
        onClick={() => onSectionClick(settingId)}
      >
        {getSettingLabel(setting)}
      </LinkLine>
    );
  }
  if (setting.type === 'button') {
    if (setting.buttonType === 'link') {
      return (
        <LinkLine
          data-sign={settingId}
          title={setting.description}
          onClick={() => onButtonClick(settingId)}
        >
          {getSettingLabel(setting)}
        </LinkLine>
      );
    }
    return (
      <Line
        data-sign={settingId}
        endAdornment={
          <Button
            size="small"
            variant="text"
            onClick={() => onButtonClick(settingId)}
          >
            {setting.buttonLabel || 'Open'}
          </Button>
        }
      >
        {getSettingLabel(setting)}
      </Line>
    );
  }
  if (setting.type === 'boolean') {
    return (
      <SwitchLine
        data-sign={`thirdPartySettings-${settingId}`}
        checked={Boolean(setting.value)}
        disabled={setting.disabled || setting.readOnly}
        onChange={(value) => onSettingChange(setting, value)}
      >
        {getSettingLabel(setting)}
        {getReadOnlyAdornment(setting)}
      </SwitchLine>
    );
  }
  if (setting.type === 'option') {
    if (setting.multiple) {
      const selectedValues = Array.isArray(setting.value) ? setting.value : [];
      return (
        <Line
          data-sign={`thirdPartySettings-${settingId}`}
          endAdornment={
            <Select
              className="w-[138px]"
              disabled={setting.disabled || setting.readOnly}
              selectMode="multiple"
              size="medium"
              value={selectedValues}
              renderValue={(value) => {
                const values = Array.isArray(value) ? value : [];
                return values
                  .map(
                    (selectedValue) =>
                      validOptions.find((option) => option.id === selectedValue)
                        ?.name,
                  )
                  .filter(Boolean)
                  .join(', ');
              }}
              onChange={(event) => onSettingChange(setting, event.target.value)}
            >
              {validOptions.map((option) => (
                <Option key={option.id} value={option.id}>
                  {option.name}
                </Option>
              ))}
            </Select>
          }
        >
          {getSettingLabel(setting)}
          {getReadOnlyAdornment(setting)}
        </Line>
      );
    }
    return (
      <SelectLine
        data-sign={`thirdPartySettings-${settingId}`}
        disabled={setting.disabled || setting.readOnly}
        value={setting.value}
        options={validOptions.map((option) => ({
          label: option.name!,
          value: option.id!,
        }))}
        onChange={(value) => onSettingChange(setting, value)}
      >
        {getSettingLabel(setting)}
        {getReadOnlyAdornment(setting)}
      </SelectLine>
    );
  }
  if (setting.type === 'externalLink' && setting.uri) {
    return (
      <Line
        component="a"
        data-sign={settingId}
        href={setting.uri}
        rel="noopener noreferrer"
        target="_blank"
      >
        {getSettingLabel(setting)}
      </Line>
    );
  }
  if (setting.type === 'group') {
    const childSettings = getOrderedSettings(setting.items ?? []);
    if (childSettings.length === 0) {
      return null;
    }
    return (
      <>
        <Line
          aria-expanded={isExpanded}
          data-sign={settingId}
          endAdornment={<Icon symbol={isExpanded ? CaretUpMd : CaretDownMd} />}
          onClick={() => setIsExpanded((value) => !value)}
        >
          {getSettingLabel(setting)}
        </Line>
        {isExpanded ? (
          <div className="ml-3 overflow-hidden rounded-lg">
            {childSettings.map((childSetting) => (
              <ThirdPartySettingRenderer
                key={getSettingId(childSetting)}
                setting={childSetting}
                onButtonClick={onButtonClick}
                onSectionClick={onSectionClick}
                onSettingChange={onSettingChange}
              />
            ))}
          </div>
        ) : null}
      </>
    );
  }
  if (setting.type === 'typography' && typeof setting.value === 'string') {
    return (
      <Line data-sign={settingId}>
        <TextWithMarkdown text={setting.value} />
      </Line>
    );
  }
  return null;
};

/** Renders registered third-party settings with Spring UI controls. */
export const ThirdPartySettings: FunctionComponent<ThirdPartySettingsProps> = ({
  settings,
  groupId,
  excludedGroupIds = [],
  showGroupLabels = false,
  minimumOrder,
  maximumOrder,
  onButtonClick,
  onSectionClick,
  onSettingChange,
}) => {
  const standaloneEntries = groupId
    ? []
    : getStandaloneSettingEntries({ settings, excludedGroupIds });
  const renderedSettings = groupId
    ? getGroupSettings(settings, groupId)
    : standaloneEntries.map(({ setting }) => setting);
  if (renderedSettings.length === 0) {
    return null;
  }
  if (showGroupLabels) {
    const sections = getLabeledSections(standaloneEntries).filter(
      (section) =>
        (typeof minimumOrder === 'undefined' ||
          section.order >= minimumOrder) &&
        (typeof maximumOrder === 'undefined' || section.order < maximumOrder),
    );
    if (sections.length === 0) {
      return null;
    }
    return (
      <>
        {sections.map((section) => (
          <Section
            key={section.id}
            data-sign={section.dataSign}
            info={section.info}
            label={section.label}
          >
            {section.settings.map((setting) => (
              <ThirdPartySettingRenderer
                key={getSettingId(setting)}
                setting={setting}
                onButtonClick={onButtonClick}
                onSectionClick={onSectionClick}
                onSettingChange={onSettingChange}
              />
            ))}
          </Section>
        ))}
      </>
    );
  }
  return (
    <>
      {renderedSettings.map((setting) => (
        <ThirdPartySettingRenderer
          key={getSettingId(setting)}
          setting={setting}
          onButtonClick={onButtonClick}
          onSectionClick={onSectionClick}
          onSettingChange={onSettingChange}
        />
      ))}
    </>
  );
};
