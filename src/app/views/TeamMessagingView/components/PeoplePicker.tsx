import {
  Autocomplete,
  type AutocompleteRenderOptionState,
  Avatar,
  ListItemText,
  SuggestionListItem,
  type SuggestionListItemData,
} from '@ringcentral/spring-ui';
import React, { useMemo, useState } from 'react';

import { t } from '../i18n';
import type { CreateTeamContact } from '../TeamMessaging.view.interface';

export type PeopleOption = CreateTeamContact &
  SuggestionListItemData & {
    label: string;
  };

type PeopleRenderOption = PeopleOption &
  React.ComponentProps<typeof SuggestionListItem> & {
    key?: React.Key;
  };

/** Contacts are searched once at least 3 characters are typed, as in legacy. */
const DEFAULT_MIN_SEARCH_LENGTH = 3;

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
  } = option as PeopleRenderOption;
  const optionId = String(id);
  return (
    <SuggestionListItem
      {...optionProps}
      key={key ?? optionId}
      id={optionId}
      highlighted={highlighted}
      data-sign={`peopleOption-${optionId}`}
    >
      <div className="mr-3 flex-none">
        <Avatar size="xsmall" src={avatarUrl} alt={label} />
      </div>
      <ListItemText primary={label} secondary={email} />
    </SuggestionListItem>
  );
}

/**
 * Searches company contacts and collects the chosen people as tags, for the
 * "New conversation" and "Create team" dialogs.
 */
export function PeoplePicker({
  searchContacts,
  selected,
  onChange,
  errorText,
  autoFocus = false,
  minSearchLength = DEFAULT_MIN_SEARCH_LENGTH,
  placeholder = t('searchAndAddPeople'),
  'data-sign': dataSign,
}: {
  searchContacts: (searchText: string) => CreateTeamContact[];
  selected: PeopleOption[];
  onChange: (selected: PeopleOption[]) => void;
  /** Shown under the field, marking it as invalid. */
  errorText?: string;
  autoFocus?: boolean;
  /** Characters typed before searching; a short list can search at once. */
  minSearchLength?: number;
  placeholder?: string;
  'data-sign'?: string;
}): React.ReactElement {
  const [searchText, setSearchText] = useState('');
  const options = useMemo<PeopleOption[]>(() => {
    if (searchText.trim().length < minSearchLength) {
      return [];
    }
    return searchContacts(searchText)
      .filter((contact) => !selected.some((item) => item.id === contact.id))
      .map((contact) => ({ ...contact, label: contact.name }));
  }, [searchContacts, searchText, selected, minSearchLength]);
  return (
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
        onChange(value as PeopleOption[])
      }
      renderOption={renderOption}
      // Inside a dialog the list renders in the dialog by default, whose
      // body clips it; render it over the page instead.
      PopperProps={{ disablePortal: false }}
      openOnFocus={false}
      toggleWithInput={false}
      clearBtn
      autoFocus={autoFocus}
      placeholder={placeholder}
      error={!!errorText}
      helperText={errorText}
      inputProps={{ 'data-sign': dataSign }}
    />
  );
}
