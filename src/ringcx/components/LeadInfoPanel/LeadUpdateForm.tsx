import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { Button, Textarea, TextField } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React, { useMemo, useState } from 'react';

import {
  CX_LEAD_MAX_PHONE_NUMBERS,
  parseCxLeadPhoneNumbers,
} from '../../lib/parseCxLeadPhoneNumbers';
import type { CxLeadUpdateFields } from '../../services/CxClient/interfaces';
import type { CxLeadDetails } from '../../services/CxLeadInfo/CxLeadInfo.interface';
import type { LeadUpdateFormProps } from './LeadInfoPanel.interface';
import i18n from './i18n';

type EditableField = Exclude<keyof CxLeadUpdateFields, 'externId'>;

type FieldValues = Record<EditableField, string>;

type LabelKey =
  | 'suffix'
  | 'title'
  | 'firstName'
  | 'midName'
  | 'lastName'
  | 'address1'
  | 'address2'
  | 'city'
  | 'state'
  | 'zip'
  | 'email'
  | 'gateKeeper';

/** Agent One's fields, order and lengths (`leadUpdate.tpl.html`). */
const TEXT_FIELDS: ReadonlyArray<[EditableField, LabelKey, number]> = [
  ['suffix', 'suffix', 20],
  ['title', 'title', 20],
  ['firstName', 'firstName', 50],
  ['midName', 'midName', 50],
  ['lastName', 'lastName', 50],
  ['address1', 'address1', 100],
  ['address2', 'address2', 100],
  ['city', 'city', 50],
  ['state', 'state', 50],
  ['zip', 'zip', 50],
  ['email', 'email', 255],
  ['gateKeeper', 'gateKeeper', 255],
];

const AUX_FIELDS: readonly EditableField[] = [
  'auxData1',
  'auxData2',
  'auxData3',
  'auxData4',
  'auxData5',
];

const AUX_MAX_LENGTH = 1024;

const EDITABLE_FIELDS: readonly EditableField[] = [
  ...TEXT_FIELDS.map(([field]) => field),
  ...AUX_FIELDS,
];

function getFieldValues(lead: CxLeadDetails): FieldValues {
  return Object.fromEntries(
    EDITABLE_FIELDS.map((field) => [field, String(lead[field] ?? '')]),
  ) as FieldValues;
}

function limitLines(value: string): string {
  return value.split('\n').slice(0, CX_LEAD_MAX_PHONE_NUMBERS).join('\n');
}

/**
 * The phone field's error, as Agent One words it, or `''` when valid.
 */
function usePhoneError(phoneText: string): {
  phoneNumbers: string[];
  error: string;
} {
  const { t } = useLocale(i18n);
  return useMemo(() => {
    const { phoneNumbers, invalidLines } = parseCxLeadPhoneNumbers(phoneText);
    if (invalidLines.length) {
      const key =
        invalidLines.length > 1 ? 'invalidPhoneNumbers' : 'invalidPhoneNumber';
      return {
        phoneNumbers,
        error: t(key, { value: invalidLines.join(', ') }),
      };
    }
    return {
      phoneNumbers,
      error: phoneNumbers.length ? '' : t('phoneRequired'),
    };
  }, [phoneText, t]);
}

/**
 * Agent One's "Update lead" dialog, shown in its own side widget tab: the lead's numbers, one per line, then its
 * name, address, contact and aux fields. The numbers are locked when the
 * campaign does not let agents change them.
 */
export const LeadUpdateForm: FunctionComponent<LeadUpdateFormProps> = ({
  showHeader = true,
  lead,
  phoneNumbers: initialPhoneNumbers,
  auxLabels,
  canEditPhone,
  onClose,
  onSave,
}) => {
  const { t } = useLocale(i18n);
  // Taken once: the form edits the lead as it was when it opened.
  const [initialPhoneText] = useState(() => initialPhoneNumbers.join('\n'));
  const [initialValues] = useState(() => getFieldValues(lead));
  const [phoneText, setPhoneText] = useState(initialPhoneText);
  const [values, setValues] = useState(initialValues);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const { phoneNumbers, error: phoneError } = usePhoneError(phoneText);
  const isPhoneInvalid = canEditPhone && !!phoneError;
  const isDirty =
    phoneText !== initialPhoneText ||
    EDITABLE_FIELDS.some((field) => values[field] !== initialValues[field]);
  const setValue = (field: EditableField, value: string) =>
    setValues((current) => ({ ...current, [field]: value }));
  const handleSave = async () => {
    setSaving(true);
    const saved = await onSave({
      phoneNumbers: canEditPhone ? phoneNumbers : initialPhoneNumbers,
      fields: { ...values, externId: String(lead.externId ?? '') },
    });
    setSaving(false);
    if (saved) {
      onClose();
    }
  };
  const renderField = (
    field: EditableField,
    label: string,
    maxLength: number,
  ) => (
    <TextField
      key={field}
      label={label}
      value={values[field]}
      onChange={(event) => setValue(field, event.target.value)}
      inputProps={{ maxLength }}
      clearBtn={false}
      fullWidth
      data-sign={`leadUpdate-${field}`}
    />
  );
  return (
    <div
      className="flex h-full min-h-0 flex-col bg-neutral-base"
      data-sign="leadUpdateForm"
    >
      {showHeader ? (
        <PageHeader onBackClick={onClose}>{t('updateLead')}</PageHeader>
      ) : null}
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
        <Textarea
          label={t('phone')}
          value={phoneText}
          onChange={(event) => setPhoneText(limitLines(event.target.value))}
          onBlur={() => setPhoneTouched(true)}
          disabled={!canEditPhone}
          required={canEditPhone}
          error={isPhoneInvalid && phoneTouched}
          helperText={
            isPhoneInvalid && phoneTouched ? phoneError : t('multiPhoneInfo')
          }
          minRows={2}
          clearBtn={false}
          fullWidth
          data-sign="leadUpdate-phone"
        />
        {TEXT_FIELDS.map(([field, labelKey, maxLength]) =>
          renderField(field, t(labelKey), maxLength),
        )}
        {AUX_FIELDS.map((field, index) =>
          renderField(
            field,
            auxLabels[index] || t(`aux${index + 1}` as 'aux1'),
            AUX_MAX_LENGTH,
          ),
        )}
      </div>
      <div className="flex justify-end gap-2 border-t border-neutral-b4 p-4">
        <Button
          variant="text"
          onClick={onClose}
          disabled={saving}
          data-sign="leadUpdateCancel"
        >
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={saving || !isDirty || isPhoneInvalid}
          loading={saving}
          data-sign="leadUpdateSave"
        >
          {t('save')}
        </Button>
      </div>
    </div>
  );
};
