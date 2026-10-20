import type { FunctionComponent } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Textarea,
  Select,
  Option,
  Checkbox,
  DatePicker,
  TimePicker,
} from '@ringcentral/spring-ui';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { TimezoneSelect, formatDateTimeToServerTime } from '../TimezoneSelect';
import type { DispositionItem } from '../../services/CxLeads';
import type { ManualPassFormProps } from './ManualPassForm.interface';
import i18n from './i18n';

/**
 * ManualPassForm - Form for manual pass lead functionality
 *
 * Allows agents to pass a lead with disposition, notes, and optional callback
 * scheduling. It fills its container: the Leads tab and the Lead side widget
 * tab show it in place of their content, so it never covers the whole app.
 * The form starts empty each time it mounts.
 */
export const ManualPassForm: FunctionComponent<ManualPassFormProps> = ({
  onClose,
  onSubmit,
  fetchDispositionList,
  campaignId,
  defaultTimezone,
  disabled = false,
  leadName,
  showHeader = true,
}) => {
  const { t } = useLocale(i18n);
  const [dispositionList, setDispositionList] = useState<DispositionItem[]>([]);
  const [notes, setNotes] = useState('');
  const [callback, setCallback] = useState(false);
  const [callbackDate, setCallbackDate] = useState<Date | null>(
    () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
  );
  const [disposition, setDisposition] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timezone, setTimezone] = useState(
    defaultTimezone || 'America/New_York',
  );

  // Fetch dispositions when the form opens
  useEffect(() => {
    if (!campaignId) return;

    let mounted = true;
    const fetchDispositions = async () => {
      setLoading(true);
      try {
        const list = await fetchDispositionList(campaignId);
        if (mounted) {
          setDispositionList(list);
          setTimezone(defaultTimezone || 'America/New_York');
        }
      } catch (error) {
        console.error('Error fetching dispositions:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchDispositions();
    return () => {
      mounted = false;
    };
  }, [campaignId, fetchDispositionList, defaultTimezone]);

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setNotes(e.target.value);
    },
    [],
  );

  const handleDispositionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDisposition(e.target.value || '');
    },
    [],
  );

  const handleCallbackChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCallback(e.target.checked);
    },
    [],
  );

  const handleDateChange = useCallback(
    (value: Date | null) => {
      if (value && callbackDate) {
        // Preserve time from current callbackDate
        const newDate = new Date(value);
        newDate.setHours(callbackDate.getHours());
        newDate.setMinutes(callbackDate.getMinutes());
        setCallbackDate(newDate);
      } else {
        setCallbackDate(value);
      }
    },
    [callbackDate],
  );

  const handleTimeChange = useCallback(
    (value: Date | null) => {
      if (!value || !callbackDate) return;
      const newDate = new Date(callbackDate);
      newDate.setHours(value.getHours());
      newDate.setMinutes(value.getMinutes());
      setCallbackDate(newDate);
    },
    [callbackDate],
  );

  const handleTimezoneChange = useCallback((value: string) => {
    setTimezone(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!disposition) return;

    setSubmitting(true);
    try {
      const callbackDTS =
        callback && callbackDate
          ? formatDateTimeToServerTime(callbackDate, timezone)
          : '';

      await onSubmit({
        dispositionId: disposition,
        notes,
        callback,
        callbackDTS,
      });
    } finally {
      setSubmitting(false);
    }
  }, [disposition, notes, callback, callbackDate, timezone, onSubmit]);

  const handleClose = useCallback(() => {
    if (!submitting) {
      onClose();
    }
  }, [onClose, submitting]);

  const isSubmitDisabled = disabled || loading || submitting || !disposition;

  return (
    <div
      className="flex flex-col h-full bg-neutral-base"
      data-sign="manualPassForm"
    >
      {showHeader ? (
        <PageHeader onBackClick={handleClose}>{t('manualPass')}</PageHeader>
      ) : null}
      {/* Content */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {leadName ? (
          <div
            className="typography-subtitle truncate text-neutral-b1"
            title={leadName}
            data-sign="manualPassLead"
          >
            {leadName}
          </div>
        ) : null}
        <Textarea
          label={t('notes')}
          value={notes}
          onChange={handleNotesChange}
          placeholder={t('enterNotes')}
          fullWidth
          data-sign="manualPassNotes"
        />

        <Select
          label={t('disposition')}
          value={disposition || null}
          placeholder={t('selectDisposition')}
          onChange={handleDispositionChange}
          required
          data-sign="manualPassDisposition"
          renderValue={(value) => {
            if (!value) return t('selectDisposition');
            const selected = dispositionList.find(
              (item) => item.value === value,
            );
            return selected?.label || t('selectDisposition');
          }}
        >
          {dispositionList.map((item) => (
            <Option key={item.value} value={item.value}>
              {item.label}
            </Option>
          ))}
        </Select>

        {disposition && (
          <>
            <label
              className="flex items-center gap-2 typography-mainText text-neutral-b1 cursor-pointer"
              data-sign="manualPassCallback"
            >
              <Checkbox checked={callback} onChange={handleCallbackChange} />
              {t('setCallbackTime')}
            </label>

            {callback && (
              <div className="flex flex-col gap-4">
                <TimezoneSelect
                  value={timezone}
                  onChange={handleTimezoneChange}
                  label={t('timezone')}
                  data-sign="manualPassTimezone"
                />

                <DatePicker
                  value={callbackDate}
                  onChange={handleDateChange}
                  label={t('callbackDate')}
                  fullWidth
                  data-sign="manualPassDate"
                  disablePast
                />
                <TimePicker
                  dateMode
                  value={callbackDate}
                  onChange={handleTimeChange}
                  label={t('callbackTime')}
                  fullWidth
                  data-sign="manualPassTime"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 p-4 border-t border-neutral-b4">
        <Button
          variant="text"
          onClick={onClose}
          disabled={submitting}
          data-sign="manualPassCancel"
        >
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          loading={submitting}
          data-sign="manualPassSubmit"
        >
          {t('submit')}
        </Button>
      </div>
    </div>
  );
};
