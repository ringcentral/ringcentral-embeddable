import {
  SearchInputToggle,
  SingleFilter,
} from '@ringcentral-integration/micro-message/src/app/components';
import { AddContactMd, PlusMd } from '@ringcentral/spring-icon';
import { IconButton, Menu, MenuItem } from '@ringcentral/spring-ui';
import type { ChangeEvent } from 'react';
import React, { useRef, useState } from 'react';

import { t } from './i18n';

function AddButton({
  type,
  canAdd,
  onAddExtension,
  onAddExtensionForType,
}: {
  type: string;
  canAdd: boolean;
  onAddExtension: () => void;
  onAddExtensionForType: (type: string) => void;
}) {
  const anchorRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!canAdd) return null;

  if (type === 'All') {
    return (
      <>
        <IconButton
          ref={anchorRef}
          variant="icon"
          color="secondary"
          size="small"
          symbol={PlusMd}
          data-sign="addExtensionMenu"
          onClick={() => setMenuOpen(true)}
        />
        {/* @ts-expect-error - spring-ui Menu typing issue with required HTML attributes */}
        <Menu
          open={menuOpen}
          anchorEl={anchorRef.current}
          onClose={() => setMenuOpen(false)}
        >
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
              onAddExtensionForType('User');
            }}
          >
            {t('addExtensions')}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setMenuOpen(false);
              onAddExtensionForType('ParkLocation');
            }}
          >
            {t('addParkLocations')}
          </MenuItem>
        </Menu>
      </>
    );
  }

  if (type === 'User') {
    return (
      <IconButton
        variant="icon"
        color="secondary"
        size="small"
        symbol={AddContactMd}
        data-sign="addExtension"
        TooltipProps={{ title: t('addExtensions') }}
        onClick={onAddExtension}
      />
    );
  }

  if (type === 'ParkLocation') {
    return (
      <IconButton
        variant="icon"
        color="secondary"
        size="small"
        symbol={PlusMd}
        data-sign="addParkLocation"
        TooltipProps={{ title: t('addParkLocations') }}
        onClick={onAddExtension}
      />
    );
  }

  return null;
}

export function SearchAndFilter({
  searchInput,
  onSearchInputChange,
  type,
  onTypeChange,
  typeFilterSelections,
  canAdd,
  onAddExtension,
  onAddExtensionForType,
}: {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  type: string;
  onTypeChange: (type: string) => void;
  typeFilterSelections: { label: string; value: string }[];
  canAdd: boolean;
  onAddExtension: () => void;
  onAddExtensionForType: (type: string) => void;
}) {
  const [searchExpanded, setSearchExpanded] = useState(false);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1"
      data-sign="callHUDSearchAndFilter"
    >
      <div className="flex-auto">
        <SearchInputToggle
          searchInput={searchInput}
          onSearchInputChange={(e: ChangeEvent<HTMLInputElement>) => {
            onSearchInputChange(e.target.value);
          }}
          placeholder={t('search')}
          data-sign="callHUDSearchInput"
          expanded={searchExpanded}
          onExpandedChange={setSearchExpanded}
        />
      </div>
      <div className="flex-none" data-sign="callHUDTypeFilter">
        <SingleFilter
          data={typeFilterSelections}
          visibleCount={searchExpanded ? 1 : 2}
          value={type}
          onSelect={(value) => onTypeChange(value)}
          MoreButtonProps={{
            'data-sign': 'callHUDFilterExpand',
          }}
          MenuProps={{
            onClose: () => {
              setSearchExpanded(false);
            },
          }}
        />
      </div>
      <AddButton
        type={type}
        canAdd={canAdd}
        onAddExtension={onAddExtension}
        onAddExtensionForType={onAddExtensionForType}
      />
    </div>
  );
}
