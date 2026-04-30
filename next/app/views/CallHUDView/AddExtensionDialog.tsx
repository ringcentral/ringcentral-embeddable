import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components';
import { useModalItemView } from '@ringcentral-integration/micro-core/src/app/views';
import {
  Autocomplete,
  Button,
  DialogActions,
  ListItemText,
  SuggestionListItem,
  type AutocompleteRenderOptionState,
  type SuggestionListItemData,
} from '@ringcentral/spring-ui';
import React, { useMemo, useState } from 'react';

import type { AvailableExtension } from './CallHUD.view.interface';
import { t } from './i18n';

type ExtensionOption = AvailableExtension &
  SuggestionListItemData & {
    label: string;
  };

type ExtensionRenderOption = ExtensionOption &
  React.ComponentProps<typeof SuggestionListItem> & {
    key?: React.Key;
  };

const filterOptions = (
  options: SuggestionListItemData[],
): SuggestionListItemData[] => options;

const getOptionLabel = (option: SuggestionListItemData): string =>
  option.label ?? '';

const isOptionEqualToValue = (
  option: SuggestionListItemData,
  value: SuggestionListItemData,
): boolean => option.id === value.id;

export function AddExtensionContent({
  allExtensions,
  filterInput,
  type,
  onFilterChange,
  onAdd,
  onCancel,
}: {
  allExtensions: AvailableExtension[];
  filterInput: string;
  type: string;
  onFilterChange: (value: string) => void;
  onAdd: (extensions: AvailableExtension[]) => Promise<void>;
  onCancel: () => void;
}) {
  const { action } = useModalItemView();
  const [adding, setAdding] = useState(false);
  const [selectedExtensions, setSelectedExtensions] = useState<
    ExtensionOption[]
  >([]);

  const options = useMemo(
    () =>
      allExtensions
        .filter(
          (ext) =>
            !selectedExtensions.some((selected) => selected.id === ext.id),
        )
        .map((ext) => ({
          ...ext,
          label: ext.name || ext.extensionNumber || '',
        })),
    [allExtensions, selectedExtensions],
  );

  const renderOption = (
    option: SuggestionListItemData,
    { highlighted }: AutocompleteRenderOptionState,
  ) => {
    const {
      key,
      id,
      label,
      name: _name,
      extensionNumber,
      profileImageUrl,
      ...optionProps
    } = option as ExtensionRenderOption;
    const optionId = String(id);
    return (
      <SuggestionListItem
        {...optionProps}
        key={key ?? optionId}
        id={optionId}
        highlighted={highlighted}
        data-sign={`addExtensionOption-${optionId}`}
      >
        <div className="mr-3 flex-none">
          <ContactAvatar
            url={profileImageUrl}
            contactName={label}
            size="xsmall"
          />
        </div>
        <ListItemText
          primary={label}
          secondary={extensionNumber ? `Ext.${extensionNumber}` : undefined}
        />
      </SuggestionListItem>
    );
  };

  const handleSelectionChange = (
    extensions: SuggestionListItemData[],
  ): void => {
    setSelectedExtensions(extensions as ExtensionOption[]);
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd(selectedExtensions);
      action?.close('confirmClick');
    } finally {
      setAdding(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    action?.cancel('cancelClick');
  };

  return (
    <>
      <div data-sign="addExtensionDialog">
        <Autocomplete
          variant="tags"
          inputVariant="outlined"
          className="w-full"
          size="medium"
          multiple
          fullWidth
          value={selectedExtensions}
          inputValue={filterInput}
          options={options}
          filterOptions={filterOptions}
          getOptionLabel={getOptionLabel}
          isOptionEqualToValue={isOptionEqualToValue}
          onInputChange={onFilterChange}
          onChange={handleSelectionChange}
          renderOption={renderOption}
          openOnFocus={false}
          toggleWithInput={false}
          clearBtn
          placeholder={
            type === 'User' ? t('searchContacts') : t('enterNameOrNumber')
          }
          autoFocus
          inputProps={{
            'data-sign': 'addExtensionSearchInput',
          }}
        />
      </div>
      <DialogActions className="pr-0">
        <Button
          data-sign="DialogCancelButton"
          color="secondary"
          variant="outlined"
          disabled={adding}
          onClick={handleCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          data-sign="DialogConfirmButton"
          loading={adding}
          disabled={adding || selectedExtensions.length === 0}
          onClick={handleAdd}
        >
          {t('add')}
        </Button>
      </DialogActions>
    </>
  );
}
