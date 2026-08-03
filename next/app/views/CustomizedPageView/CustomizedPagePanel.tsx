import { AppFooterNav } from '@ringcentral-integration/micro-core/src/app/components/AppContext/AppFooter';
import { AppHeaderNav } from '@ringcentral-integration/micro-core/src/app/components/AppContext/AppHeader';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-spring-page';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import {
  DownloadMd,
  EditMd,
  PlusMd,
  RefreshMd,
  SettingsMd,
} from '@ringcentral/spring-icon';
import {
  Button,
  IconButton,
} from '@ringcentral/spring-ui';
import clsx from 'clsx';
import type { ComponentType } from 'react';
import React, { useEffect, useState } from 'react';

import type {
  ThirdPartyPage,
  ThirdPartyTabAction,
  UnknownRecord,
} from '../../services/ThirdParty/ThirdParty.interface';

import i18n from './i18n';

const ACTION_ICONS: Readonly<
  Partial<Record<string, ComponentType>>
> = {
  settings: SettingsMd,
  new: PlusMd,
  refresh: RefreshMd,
  download: DownloadMd,
  edit: EditMd,
};

function normalizeFormData(value: unknown): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as UnknownRecord;
}

function valuesAreEqual(first: unknown, second: unknown): boolean {
  if (
    first &&
    second &&
    typeof first === 'object' &&
    typeof second === 'object'
  ) {
    return JSON.stringify(first) === JSON.stringify(second);
  }
  return first === second;
}

function getChangedKeys(
  currentFormData: UnknownRecord,
  nextFormData: UnknownRecord,
): string[] {
  return Object.keys(nextFormData).filter(
    (key) => !valuesAreEqual(currentFormData[key], nextFormData[key]),
  );
}

function allRequiredFieldsAreFilled(
  formData: UnknownRecord,
  schema: UnknownRecord,
): boolean {
  if (!Array.isArray(schema.required)) {
    return true;
  }
  return schema.required
    .filter((key): key is string => typeof key === 'string')
    .every((key) => {
      const value = formData[key];
      return value !== undefined && value !== null && value !== '';
    });
}

function getActionIcon(
  action: ThirdPartyTabAction,
): ComponentType | undefined {
  return action.icon ? ACTION_ICONS[action.icon] : undefined;
}

export function CustomizedPagePanel({
  page,
  onBack,
  onButtonClick,
  onFormDataChange,
  onSubmit,
  onTabActionClick,
}: {
  page: ThirdPartyPage;
  onBack: () => void;
  onButtonClick: (buttonId: string, formData: UnknownRecord) => void;
  onFormDataChange: (
    pageId: string,
    formData: UnknownRecord,
    changedKeys: string[],
  ) => void;
  onSubmit: (pageId: string, formData: UnknownRecord) => void;
  onTabActionClick: (tabId: string, actionId: string) => void;
}) {
  const { t } = useLocale(i18n);
  const [formData, setFormData] = useState<UnknownRecord>(() =>
    normalizeFormData(page.formData),
  );

  useEffect(() => {
    setFormData(normalizeFormData(page.formData));
  }, [page.formData, page.id]);

  const schema = page.schema ?? {};
  const uiSchema = page.uiSchema ?? {};
  const isTab = page.type === 'tab';
  const submitButtonOptions = uiSchema.submitButtonOptions;
  const showSubmitButton = Boolean(submitButtonOptions);
  const saveButtonLabel = submitButtonOptions?.submitText || t('save');
  const title = page.title || '';
  const actions = (page.actions ?? []).filter(
    (action) => action.id && getActionIcon(action),
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      {isTab ? (
        <AppHeaderNav override={false} title={title}>
          {actions.length > 0 ? (
            <div
              className="flex items-center justify-end gap-1"
              data-sign="customizedTabActions"
            >
              {actions.map((action) => (
                <IconButton
                  key={action.id}
                  variant="icon"
                  color="secondary"
                  size="small"
                  symbol={getActionIcon(action)}
                  TooltipProps={{ title: action.title || action.id }}
                  data-sign={`customizedTabAction-${action.id}`}
                  onClick={() => onTabActionClick(page.id, action.id)}
                />
              ))}
            </div>
          ) : null}
        </AppHeaderNav>
      ) : (
        <AppHeaderNav override>
          <PageHeader
            onBackClick={page.hideBackButton ? undefined : onBack}
            endAdornment={
              showSubmitButton ? (
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!allRequiredFieldsAreFilled(formData, schema)}
                  data-sign="customizedPageSave"
                  onClick={() => onSubmit(page.id, formData)}
                >
                  {saveButtonLabel}
                </Button>
              ) : null
            }
          >
            {title}
          </PageHeader>
        </AppHeaderNav>
      )}
      <div
        className={clsx(
          'flex-auto overflow-y-auto px-4 pb-4'
        )}
        data-sign="customizedPageContent"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.stopPropagation();
          }
        }}
      >
        <JSONSchemaPage
          schema={schema}
          uiSchema={uiSchema}
          formData={formData}
          hiddenSubmitButton={!isTab || !showSubmitButton}
          onFormDataChange={(value: unknown) => {
            const nextFormData = normalizeFormData(value);
            const changedKeys = getChangedKeys(formData, nextFormData);
            setFormData(nextFormData);
            onFormDataChange(page.id, nextFormData, changedKeys);
          }}
          onButtonClick={(buttonId) => onButtonClick(buttonId, formData)}
          onSubmit={() => onSubmit(page.id, formData)}
        />
      </div>
      {!isTab ? <AppFooterNav /> : null}
    </div>
  );
}
