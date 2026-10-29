import { useModalItemView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  Button,
  DialogActions,
  Textarea,
  TextField,
} from '@ringcentral/spring-ui';
import React, { useState } from 'react';

import { t } from '../../i18n';
import type { CreateNoteContentProps } from '../../TeamMessaging.view.interface';

/** The API limits a note's title to 250 characters. */
const MAX_TITLE_LENGTH = 250;

/** The "Create note" or "Edit note" dialog body: a title and the text. */
export function CreateNoteContent({
  initialValues,
  submitLabel = t('create'),
  onSubmit,
  onCancel,
}: CreateNoteContentProps): React.ReactElement {
  const { action } = useModalItemView();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [text, setText] = useState(initialValues?.text ?? '');
  const [creating, setCreating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const titleError = showErrors && !title.trim();
  const handleCreate = async (): Promise<void> => {
    setShowErrors(true);
    if (!title.trim()) {
      return;
    }
    setCreating(true);
    const result = await onSubmit({ title: title.trim(), text });
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
      <div className="flex flex-col gap-4" data-sign="createNoteDialog">
        <TextField
          fullWidth
          size="medium"
          label={t('noteTitle')}
          value={title}
          error={titleError}
          helperText={titleError ? t('noteTitleRequired') : undefined}
          autoFocus
          inputProps={{
            'data-sign': 'noteTitleInput',
            maxLength: MAX_TITLE_LENGTH,
          }}
          onChange={(event) => setTitle(event.target.value)}
        />
        <Textarea
          fullWidth
          size="medium"
          minRows={4}
          maxRows={10}
          label={t('noteBody')}
          value={text}
          inputProps={{ 'data-sign': 'noteBodyInput' }}
          onChange={(event) => setText(event.target.value)}
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
