import { useModalItemView } from '@ringcentral-integration/micro-core/src/app/views';
import { Button, DialogActions, TextField } from '@ringcentral/spring-ui';
import React, { useState } from 'react';

import { t } from '../i18n';
import type { CreateTeamContentProps } from '../TeamMessaging.view.interface';
import { type PeopleOption, PeoplePicker } from './PeoplePicker';

/** The "Create team" dialog body: a team name and the people to add. */
export function CreateTeamContent({
  searchContacts,
  onCreate,
  onCancel,
}: CreateTeamContentProps): React.ReactElement {
  const { action } = useModalItemView();
  const [teamName, setTeamName] = useState('');
  const [selected, setSelected] = useState<PeopleOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const nameError = showErrors && !teamName.trim();
  const membersError = showErrors && selected.length === 0;
  const handleCreate = async (): Promise<void> => {
    setShowErrors(true);
    if (!teamName.trim() || selected.length === 0) {
      return;
    }
    setCreating(true);
    const result = await onCreate({
      name: teamName.trim(),
      emails: selected.map((contact) => contact.email),
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
      <div className="flex flex-col gap-4" data-sign="createTeamDialog">
        <TextField
          fullWidth
          size="medium"
          label={t('teamName')}
          value={teamName}
          error={nameError}
          helperText={nameError ? t('teamNameRequired') : undefined}
          autoFocus
          inputProps={{ 'data-sign': 'teamNameInput' }}
          onChange={(event) => setTeamName(event.target.value)}
        />
        <PeoplePicker
          searchContacts={searchContacts}
          selected={selected}
          onChange={setSelected}
          errorText={membersError ? t('membersRequired') : undefined}
          data-sign="createTeamSearchInput"
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
          {t('create')}
        </Button>
      </DialogActions>
    </>
  );
}
