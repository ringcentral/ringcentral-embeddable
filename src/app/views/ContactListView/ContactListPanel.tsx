import type { ChangeEvent } from 'react';
import React, { useCallback } from 'react';
import type { StateSnapshot } from 'react-virtuoso';
import type {
  IContact,
} from '@ringcentral-integration/commons/interfaces/Contact.model';
import { AllContactSourceName } from '@ringcentral-integration/commons/lib/contactHelper';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { useVirtuosoScrollPosition } from '@ringcentral-integration/react-hooks';
import {
  SearchInputToggle,
} from '@ringcentral-integration/micro-message/src/app/components';
import {
  CircularProgressIndicator,
  EmptyState,
  VirtualizedList,
} from '@ringcentral/spring-ui';
import { ContactsMd } from '@ringcentral/spring-icon';

import { ContactListItem } from '../../components/ContactListItem';
import i18n from './i18n';

interface ContactListPanelProps {
  contacts: IContact[];
  searchSource?: string;
  searchString: string;
  isSearching: boolean;
  showSpinner: boolean;
  onItemSelect: (args: { type: string; id: string }) => void;
  onSearchContact: (args: {
    searchSource: string;
    searchString: string;
  }) => void;
  lastPosition?: StateSnapshot;
  setLastPosition: (source: string, snapshot?: StateSnapshot) => void;
}

export function ContactListPanel({
  contacts,
  searchSource,
  searchString,
  isSearching,
  showSpinner,
  onItemSelect,
  onSearchContact,
  lastPosition,
  setLastPosition,
}: ContactListPanelProps) {
  const { t } = useLocale(i18n);

  const { virtuosoActionsRef, scrollerRef } = useVirtuosoScrollPosition(
    (snapshot: StateSnapshot) => setLastPosition(searchSource ?? '', snapshot),
  );

  const handleSearchInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onSearchContact({
        searchSource: searchSource ?? AllContactSourceName,
        searchString: e.target.value,
      });
    },
    [onSearchContact, searchSource],
  );

  const itemContent = useCallback(
    (index: number) => {
      const contact = contacts[index];
      if (!contact) return null;

      return (
        <ContactListItem
          contact={contact}
          onItemSelect={onItemSelect}
        />
      );
    },
    [contacts, onItemSelect],
  );

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <div className="flex px-3 py-1 items-center gap-2">
        <div className="flex-auto">
          <SearchInputToggle
            searchInput={searchString ?? ''}
            onSearchInputChange={handleSearchInputChange}
            placeholder={t('searchPlaceholder')}
            data-sign="contactsSearchInput"
            alwaysExpanded
          />
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {showSpinner ? (
          <div className="flex items-center justify-center h-full">
            <CircularProgressIndicator size="large" color="primary" />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={ContactsMd}
            title={t('noRecords')}
          />
        ) : (
          <VirtualizedList
            data={contacts}
            totalCount={contacts.length}
            style={{ height: '100%' }}
            virtuosoActions={virtuosoActionsRef}
            scrollerRef={scrollerRef}
            restoreStateFrom={lastPosition || undefined}
          >
            {itemContent}
          </VirtualizedList>
        )}
        {isSearching && contacts.length > 0 && (
          <div className="absolute top-0 left-0 right-0 flex justify-center pt-2 pointer-events-none">
            <CircularProgressIndicator size="small" color="primary" />
          </div>
        )}
      </div>
    </div>
  );
}
