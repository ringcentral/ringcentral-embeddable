import { useModalItemView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  Autocomplete,
  type AutocompleteRenderOptionState,
  Avatar,
  Button,
  DialogActions,
  ListItemText,
  SuggestionListItem,
  type SuggestionListItemData,
  TextField,
} from '@ringcentral/spring-ui';
import React, { useMemo, useState } from 'react';

import { t } from '../i18n';
import type {
  CreateTeamContact,
  CreateTeamContentProps,
} from '../TeamMessaging.view.interface';

type ContactOption = CreateTeamContact & SuggestionListItemData & {
  label: string;
};

type ContactRenderOption = ContactOption &
  React.ComponentProps<typeof SuggestionListItem> & {
    key?: React.Key;
  };

/** Contacts are searched once at least 3 characters are typed, as in legacy. */
const MIN_SEARCH_LENGTH = 3;

const keepOptions = (
  options: SuggestionListItemData[],
): SuggestionListItemData[] => options;

const getOptionLabel = (option: SuggestionListItemData): string =>
  option.label ?? '';

const isOptionEqualToValue = (
  option: SuggestionListItemData,
  value: SuggestionListItemData,
): boolean => option.id === value.id;

function renderOption(
  option: SuggestionListItemData,
  { highlighted }: AutocompleteRenderOptionState,
): React.ReactElement {
  const {
    key,
    id,
    label,
    name: _name,
    email,
    avatarUrl,
    ...optionProps
  } = option as ContactRenderOption;
  const optionId = String(id);
  return (
    <SuggestionListItem
      {...optionProps}
      key={key ?? optionId}
      id={optionId}
      highlighted={highlighted}
      data-sign={`createTeamOption-${optionId}`}
    >
      <div className="mr-3 flex-none">
        <Avatar size="xsmall" src={avatarUrl} alt={label} />
      </div>
      <ListItemText primary={label} secondary={email} />
    </SuggestionListItem>
  );
}

/** The "Create team" dialog body: a team name and the people to add. */
export function CreateTeamContent({
  searchContacts,
  onCreate,
  onCancel,
}: CreateTeamContentProps): React.ReactElement {
  const { action } = useModalItemView();
  const [teamName, setTeamName] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selected, setSelected] = useState<ContactOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const options = useMemo<ContactOption[]>(() => {
    if (searchText.trim().length < MIN_SEARCH_LENGTH) {
      return [];
    }
    return searchContacts(searchText)
      .filter((contact) => !selected.some((item) => item.id === contact.id))
      .map((contact) => ({ ...contact, label: contact.name }));
  }, [searchContacts, searchText, selected]);
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
        <Autocomplete
          variant="tags"
          inputVariant="outlined"
          className="w-full"
          size="medium"
          multiple
          fullWidth
          value={selected}
          inputValue={searchText}
          options={options}
          filterOptions={keepOptions}
          getOptionLabel={getOptionLabel}
          isOptionEqualToValue={isOptionEqualToValue}
          onInputChange={(value: string) => setSearchText(value)}
          onChange={(value: SuggestionListItemData[]) =>
            setSelected(value as ContactOption[])
          }
          renderOption={renderOption}
          openOnFocus={false}
          toggleWithInput={false}
          clearBtn
          placeholder={t('searchAndAddPeople')}
          error={membersError}
          helperText={membersError ? t('membersRequired') : undefined}
          inputProps={{ 'data-sign': 'createTeamSearchInput' }}
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
