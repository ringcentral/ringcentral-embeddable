import type { SuggestionListItemData } from '@ringcentral/spring-ui';

/**
 * Autocomplete filter that matches anywhere in the label (includes),
 * unlike RcAutocompleteDefaultFilterOptions which only matches from the start.
 */
export const filterByContains = (
  options: SuggestionListItemData[],
  { inputValue, getOptionLabel, selectedItems }: {
    inputValue?: string;
    getOptionLabel: (option: SuggestionListItemData) => string;
    selectedItems: SuggestionListItemData[];
  },
): SuggestionListItemData[] => {
  const query = inputValue?.toLowerCase() || '';
  return options.filter(
    (item) =>
      selectedItems.indexOf(item) < 0 &&
      getOptionLabel(item).toLowerCase().includes(query),
  );
};
