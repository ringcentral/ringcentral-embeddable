import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SearchMd } from '@ringcentral/spring-icon';
import {
  ExpandCollapseCaret,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuList,
  TextField,
} from '@ringcentral/spring-ui';

type SearchFormData = {
  filter?: string;
  search?: string;
  [key: string]: unknown;
};

type FilterInput =
  | string
  | {
      label?: string;
      value?: string;
    };

type FilterOption = {
  label: string;
  value: string;
};

type SearchUiSchema = {
  'ui:filters'?: FilterInput[];
  'ui:placeholder'?: string;
  'ui:previewLength'?: number;
};

type SearchProps = {
  disabled?: boolean;
  formData?: SearchFormData | string;
  onChange: (value: SearchFormData | string) => void;
  uiSchema?: SearchUiSchema;
};

type SearchInputToggleProps = {
  alwaysExpanded?: boolean;
  className?: string;
  dataSign: string;
  disabled?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onSearchInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  searchInput: string;
};

type SingleFilterProps = {
  className?: string;
  data: FilterOption[];
  disabled?: boolean;
  onMenuClose?: () => void;
  onSelect: (value: string) => void;
  value?: string;
  visibleCount?: number;
};

const filterButtonStyle =
  'sui-filter-button sui-filter-button-root max-w-[120px]';

function getSearchText(formData: SearchProps['formData']): string {
  if (typeof formData === 'string') {
    return formData;
  }
  return formData?.search || '';
}

function getFilterValue(formData: SearchProps['formData']): string {
  if (typeof formData === 'string') {
    return '';
  }
  return formData?.filter || '';
}

function getFilterOptions(filters: SearchUiSchema['ui:filters']): FilterOption[] {
  if (!Array.isArray(filters)) {
    return [];
  }
  return filters
    .map((filter) => {
      if (typeof filter === 'string') {
        return {
          label: filter,
          value: filter,
        };
      }
      if (!filter?.value) {
        return null;
      }
      return {
        label: filter.label || filter.value,
        value: filter.value,
      };
    })
    .filter((filter): filter is FilterOption => filter !== null);
}

function getVisibleFilterItems({
  data,
  value,
  visibleCount,
}: {
  data: FilterOption[];
  value?: string;
  visibleCount: number;
}): FilterOption[] {
  if (data.length === 0) {
    return [];
  }
  const count = Math.max(1, visibleCount);
  const visibleItems = data.slice(0, count);
  const selectedItem = data.find((item) => item.value === value);
  if (!selectedItem || visibleItems.some((item) => item.value === value)) {
    return visibleItems;
  }
  return [...visibleItems.slice(0, -1), selectedItem];
}

function getHiddenFilterItems(
  data: FilterOption[],
  visibleItems: FilterOption[],
): FilterOption[] {
  return data.filter(
    (item) =>
      !visibleItems.some((visibleItem) => visibleItem.value === item.value),
  );
}

function getNextSearchFormData({
  filter,
  formData,
  search,
}: {
  filter: string;
  formData: SearchProps['formData'];
  search: string;
}): SearchFormData {
  const currentFormData =
    typeof formData === 'object' && formData !== null ? formData : {};
  return {
    ...currentFormData,
    filter,
    search,
  };
}

function SearchInputToggle({
  alwaysExpanded = false,
  className,
  dataSign,
  disabled,
  expanded: controlledExpanded,
  onExpandedChange,
  onSearchInputChange,
  placeholder,
  searchInput,
}: SearchInputToggleProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const expanded = alwaysExpanded ? true : controlledExpanded ?? false;
  const handleSearchButtonClick = () => {
    if (disabled) {
      return;
    }
    if (!alwaysExpanded) {
      onExpandedChange?.(true);
    }
    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };
  const handleSearchBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget?.getAttribute('data-prevent-blur') === 'true') {
      return;
    }
    if (!alwaysExpanded && searchInput.length === 0) {
      onExpandedChange?.(false);
    }
  };
  useEffect(() => {
    if (!alwaysExpanded && searchInput.length > 0 && !expanded) {
      onExpandedChange?.(true);
    }
  }, [alwaysExpanded, expanded, onExpandedChange, searchInput]);
  return (
    <div className={className}>
      {expanded ? (
        <div className="overflow-hidden flex-1 min-w-0">
          <TextField
            inputRef={searchInputRef}
            placeholder={placeholder}
            startAdornment={<Icon symbol={SearchMd} size="small" />}
            variant="standard"
            size="large"
            RootProps={{
              classes: {
                focusEffect: 'hidden',
                content: 'border-none',
              },
            }}
            fullWidth
            value={searchInput}
            disabled={disabled}
            inputProps={{
              'data-sign': dataSign,
            }}
            onChange={onSearchInputChange}
            onBlur={handleSearchBlur}
          />
        </div>
      ) : (
        <div className="h-8 -ml-1 flex items-center">
          <IconButton
            variant="icon"
            size="small"
            color="secondary"
            disabled={disabled}
            onClick={handleSearchButtonClick}
            data-sign={`${dataSign}-button`}
            TooltipProps={{
              title: placeholder,
            }}
          >
            <Icon symbol={SearchMd} size="small" />
          </IconButton>
        </div>
      )}
    </div>
  );
}

function SingleFilter({
  className,
  data,
  disabled,
  onMenuClose,
  onSelect,
  value,
  visibleCount = 2,
}: SingleFilterProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const visibleItems = useMemo(
    () => getVisibleFilterItems({ data, value, visibleCount }),
    [data, value, visibleCount],
  );
  const hiddenItems = useMemo(
    () => getHiddenFilterItems(data, visibleItems),
    [data, visibleItems],
  );
  const handleMenuClose = () => {
    setIsMenuOpen(false);
    onMenuClose?.();
  };
  const handleItemClick = (itemValue: string) => {
    onSelect(itemValue);
    handleMenuClose();
  };
  if (data.length === 0) {
    return null;
  }
  return (
    <div
      className={['sui-single-filter sui-single-filter-root', className]
        .filter(Boolean)
        .join(' ')}
    >
      {visibleItems.map((item) => (
        <button
          key={item.value}
          className={[
            filterButtonStyle,
            value === item.value ? 'sui-selected' : '',
          ].filter(Boolean).join(' ')}
          title={item.label}
          aria-current={value === item.value}
          type="button"
          disabled={disabled}
          onClick={() => handleItemClick(item.value)}
          data-sign={`filter-${item.value}`}
        >
          {item.label}
        </button>
      ))}
      {hiddenItems.length > 0 ? (
        <>
          <IconButton
            ref={menuButtonRef}
            shape="squircle"
            variant="contained"
            size="small"
            color="secondary"
            background={false}
            className="sui-single-filter-more"
            disabled={disabled}
            onClick={() => setIsMenuOpen(true)}
            aria-expanded={isMenuOpen}
            data-prevent-blur="true"
            data-sign="jsonSchemaFilterExpand"
          >
            <ExpandCollapseCaret orientation="vertical" expanded={isMenuOpen} />
          </IconButton>
          <Menu
            anchorEl={menuButtonRef.current}
            open={isMenuOpen}
            onClose={handleMenuClose}
          >
            <MenuList>
              {hiddenItems.map((item) => (
                <MenuItem
                  key={item.value}
                  selected={value === item.value}
                  onClick={() => handleItemClick(item.value)}
                  title={item.label}
                >
                  {item.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </>
      ) : null}
    </div>
  );
}

export function Search({
  uiSchema = {},
  formData,
  disabled,
  onChange,
}: SearchProps) {
  const placeholder = uiSchema['ui:placeholder'] || 'Search';
  const filterOptions = getFilterOptions(uiSchema['ui:filters']);
  const searchText = getSearchText(formData);
  const defaultFilter = filterOptions[0]?.value || '';
  const selectedFilter = getFilterValue(formData) || defaultFilter;
  const [searchExpanded, setSearchExpanded] = useState(searchText.length > 0);
  if (filterOptions.length === 0) {
    return (
      <SearchInputToggle
        alwaysExpanded
        dataSign="jsonSchemaSearchInput"
        disabled={disabled}
        placeholder={placeholder}
        searchInput={searchText}
        onSearchInputChange={(event) => onChange(event.target.value)}
      />
    );
  }
  return (
    <div
      className="flex items-center gap-2 px-3 py-1"
      data-sign="jsonSchemaSearchAndFilter"
    >
      <div className="flex-auto">
        <SearchInputToggle
          dataSign="jsonSchemaSearchInput"
          disabled={disabled}
          expanded={searchExpanded}
          onExpandedChange={setSearchExpanded}
          placeholder={placeholder}
          searchInput={searchText}
          onSearchInputChange={(event) => {
            onChange(
              getNextSearchFormData({
                filter: selectedFilter,
                formData,
                search: event.target.value,
              }),
            );
          }}
        />
      </div>
      <div className="flex-none" data-sign="jsonSchemaTypeFilter">
        <SingleFilter
          data={filterOptions}
          disabled={disabled}
          value={selectedFilter}
          visibleCount={searchExpanded ? 1 : uiSchema['ui:previewLength'] || 2}
          onSelect={(filter) => {
            onChange(
              getNextSearchFormData({
                filter,
                formData,
                search: searchText,
              }),
            );
          }}
          onMenuClose={() => {
            setSearchExpanded(false);
          }}
        />
      </div>
    </div>
  );
}
