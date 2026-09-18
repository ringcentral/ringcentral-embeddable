import React, { useCallback, useEffect, useMemo, useRef, type FunctionComponent } from 'react';
import { Autocomplete, Chip, ListItemText } from '@ringcentral/spring-ui';
import type { AutocompleteRef, SuggestionListItemData } from '@ringcentral/spring-ui';

import type { CxTransferPhoneBookItem } from '../../services/CxTransferCall/CxTransferCall.interface';
import { filterByContains } from './filterOptions';

interface ContactOption extends SuggestionListItemData {
  phoneBookItemIndex: number;
  destination: string;
}

interface PhoneBookTransferTabProps {
  isActive: boolean;
  phoneBook: CxTransferPhoneBookItem[];
  selectedIndex: number | null;
  onSelectContact: (index: number | null) => void;
  labels: {
    searchContacts: string;
    noContacts: string;
  };
}

/**
 * Phone book transfer tab content with contact autocomplete.
 */
export const PhoneBookTransferTab: FunctionComponent<PhoneBookTransferTabProps> = ({
  isActive,
  phoneBook,
  selectedIndex,
  onSelectContact,
  labels,
}) => {
  const actionRef = useRef<AutocompleteRef>(null);

  useEffect(() => {
    if (isActive) {
      actionRef.current?.focus();
    }
  }, [isActive]);
  const options: ContactOption[] = useMemo(
    () =>
      phoneBook.map((contact) => ({
        id: contact.phoneBookItemIndex,
        label: contact.phoneBookName,
        phoneBookItemIndex: contact.phoneBookItemIndex,
        destination: contact.parsedDestination || contact.destination,
      })),
    [phoneBook],
  );

  const selectedValue = useMemo(() => {
    if (selectedIndex === null) return [];
    const found = options.find((o) => o.phoneBookItemIndex === selectedIndex);
    return found ? [found] : [];
  }, [options, selectedIndex]);

  const handleChange = useCallback(
    (selectedItems: SuggestionListItemData[]) => {
      const selected = selectedItems.length > 0
        ? (selectedItems[selectedItems.length - 1] as ContactOption)
        : null;
      onSelectContact(selected?.phoneBookItemIndex ?? null);
    },
    [onSelectContact],
  );

  return (
    <div className="flex-1 overflow-hidden" data-sign="phoneBookTransferTab">
      <Autocomplete
        action={actionRef}
        data-sign="phoneBookAutocomplete"
        variant="tags"
        inputVariant="outlined"
        options={options}
        value={selectedValue}
        onChange={handleChange}
        placeholder={labels.searchContacts}
        openOnFocus
        toggleButton
        size="medium"
        filterOptions={filterByContains}
        renderTags={(selectedItems, getTagProps) =>
          selectedItems.map((item, index) => {
            const contact = item as ContactOption;
            const { label, ...itemChipProps } = getTagProps(item, index);
            const { id, ...rest } = contact;
            return (
              <Chip
                key={id}
                label={label}
                aria-label={`${label}, press Backspace to remove`}
                {...rest}
                {...itemChipProps}
                size="small"
              />
            );
          })
        }
        renderOption={(option, state) => {
          const { phoneBookItemIndex, destination, label, id, error, disabled, className, ...restProps } = option as ContactOption & Record<string, unknown>;
          const itemClassName = [
            'sui-suggestion-list-item',
            state.highlighted && 'sui-suggestion-list-highlighted',
            className,
          ].filter(Boolean).join(' ');
          return (
            <div
              id={`${id}`}
              className={itemClassName}
              {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
              key={`${id || label}-${state.index}`}
            >
              <ListItemText
                primary={label as string}
                secondary={destination as string}
              />
            </div>
          );
        }}
      />
    </div>
  );
};
