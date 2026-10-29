import { useModalItemView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  Button,
  DatePicker,
  DialogActions,
  Textarea,
  TextField,
  TimePicker,
} from '@ringcentral/spring-ui';
import React, { useState } from 'react';

import { t } from '../../i18n';
import type { CreateTaskContentProps } from '../../TeamMessaging.view.interface';
import { type PeopleOption, PeoplePicker } from '../PeoplePicker';

/** The API limits a task's subject to 250 characters. */
const MAX_SUBJECT_LENGTH = 250;

/** Due time when only a date is picked: the end of that working day. */
const DEFAULT_DUE_HOUR = 17;

function withDefaultTime(date: Date): Date {
  const due = new Date(date);
  due.setHours(DEFAULT_DUE_HOUR, 0, 0, 0);
  return due;
}

/**
 * The "Create task" or "Edit task" dialog body: name, assignees, due date,
 * description.
 */
export function CreateTaskContent({
  searchMembers,
  initialValues,
  submitLabel = t('create'),
  onSubmit,
  onCancel,
}: CreateTaskContentProps): React.ReactElement {
  const { action } = useModalItemView();
  const [subject, setSubject] = useState(initialValues?.subject ?? '');
  const [assignees, setAssignees] = useState<PeopleOption[]>(() =>
    (initialValues?.assignees ?? []).map((contact) => ({
      ...contact,
      label: contact.name,
    })),
  );
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialValues?.dueDate,
  );
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  );
  const [creating, setCreating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const subjectError = showErrors && !subject.trim();
  const handleCreate = async (): Promise<void> => {
    setShowErrors(true);
    if (!subject.trim()) {
      return;
    }
    setCreating(true);
    const result = await onSubmit({
      subject: subject.trim(),
      assigneeIds: assignees.map(({ id }) => id),
      dueDate,
      description: description.trim(),
    });
    setCreating(false);
    if (result?.ok) {
      action?.close('confirmClick');
    }
  };
  const handleCancel = (): void => {
    onCancel();
    action?.cancel('cancelClick');
  };
  return (
    <>
      <div className="flex flex-col gap-4" data-sign="createTaskDialog">
        <TextField
          fullWidth
          size="medium"
          label={t('taskSubject')}
          value={subject}
          error={subjectError}
          helperText={subjectError ? t('taskSubjectRequired') : undefined}
          autoFocus
          inputProps={{
            'data-sign': 'taskSubjectInput',
            maxLength: MAX_SUBJECT_LENGTH,
          }}
          onChange={(event) => setSubject(event.target.value)}
        />
        <PeoplePicker
          searchContacts={searchMembers}
          selected={assignees}
          onChange={setAssignees}
          minSearchLength={1}
          placeholder={t('assignees')}
          data-sign="taskAssigneesInput"
        />
        <div className="flex gap-2">
          <DatePicker
            fullWidth
            size="medium"
            label={t('dueDateLabel')}
            value={dueDate ?? null}
            disablePast
            data-sign="taskDueDate"
            onChange={(date: Date) =>
              setDueDate(date ? withDefaultTime(date) : undefined)
            }
          />
          <TimePicker
            dateMode
            fullWidth
            size="medium"
            label={t('dueTimeLabel')}
            value={dueDate ?? null}
            disabled={!dueDate}
            data-sign="taskDueTime"
            onChange={(time: Date) => time && setDueDate(new Date(time))}
          />
        </div>
        <Textarea
          fullWidth
          size="medium"
          minRows={2}
          maxRows={5}
          label={t('description')}
          value={description}
          inputProps={{ 'data-sign': 'taskDescriptionInput' }}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>
      <DialogActions className="pr-0">
        <Button
          data-sign="DialogCancelButton"
          color="secondary"
          variant="outlined"
          disabled={creating}
          onClick={handleCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          data-sign="DialogConfirmButton"
          loading={creating}
          disabled={creating}
          onClick={handleCreate}
        >
          {submitLabel}
        </Button>
      </DialogActions>
    </>
  );
}
