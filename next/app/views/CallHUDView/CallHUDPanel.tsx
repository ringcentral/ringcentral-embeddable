import { Hudmd } from '@ringcentral/spring-icon';
import {
  Accordion,
  AccordionHeader,
  List,
  Text,
} from '@ringcentral/spring-ui';
import React from 'react';

import type { CallHUDPanelProps } from './CallHUD.view.interface';
import { ExtensionItem } from './ExtensionItem';
import { SearchAndFilter } from './SearchAndFilter';
import { t } from './i18n';

function ExtensionList({
  extensions,
  formatPhone,
  onClickToDial,
  disableClickToDial,
  canPark,
  onPark,
  onText,
  pickParkLocation,
  pickGroupCall,
  pickCallQueueCall,
  onRemoveExtension,
  canEdit,
}: Pick<
  CallHUDPanelProps,
  | 'extensions'
  | 'formatPhone'
  | 'onClickToDial'
  | 'disableClickToDial'
  | 'canPark'
  | 'onPark'
  | 'onText'
  | 'pickParkLocation'
  | 'pickGroupCall'
  | 'pickCallQueueCall'
  | 'onRemoveExtension'
  | 'canEdit'
>) {
  return (
    <List>
      {extensions.map((extension) => (
        <ExtensionItem
          key={extension.id}
          item={extension}
          formatPhone={formatPhone}
          onClickToDial={onClickToDial}
          disableClickToDial={disableClickToDial}
          canPark={canPark}
          onPark={onPark}
          onText={onText}
          pickParkLocation={pickParkLocation}
          pickGroupCall={pickGroupCall}
          pickCallQueueCall={pickCallQueueCall}
          onRemoveExtension={onRemoveExtension}
          canEdit={canEdit}
        />
      ))}
    </List>
  );
}

export function CallHUDPanel({
  searchInput,
  onSearchInputChange,
  type,
  onTypeChange,
  typeList,
  typeFilterSelections,
  extensions,
  groupedExtensions,
  formatPhone,
  onClickToDial,
  disableClickToDial,
  canPark,
  onPark,
  onText,
  pickParkLocation,
  pickGroupCall,
  pickCallQueueCall,
  onAddExtension,
  onAddExtensionForType,
  onRemoveExtension,
  canEdit,
}: CallHUDPanelProps) {
  const extensionListProps = {
    formatPhone,
    onClickToDial,
    disableClickToDial,
    canPark,
    onPark,
    onText,
    pickParkLocation,
    pickGroupCall,
    pickCallQueueCall,
    onRemoveExtension,
    canEdit,
  };

  const isAllView = type === 'All';
  const groupTypeList = typeList.filter((item) => item.id !== 'All');
  const nonEmptyGroupTypeList = groupTypeList.filter(
    (item) => (groupedExtensions[item.id] ?? []).length > 0,
  );
  const emptyGroupTypeList = groupTypeList.filter(
    (item) => (groupedExtensions[item.id] ?? []).length === 0,
  );
  const orderedGroupTypeList = [
    ...nonEmptyGroupTypeList,
    ...emptyGroupTypeList,
  ];

  return (
    <div
      className="flex flex-col h-full w-full"
      data-sign="callHUDPanel"
    >
      <SearchAndFilter
        searchInput={searchInput}
        onSearchInputChange={onSearchInputChange}
        type={type}
        onTypeChange={onTypeChange}
        typeFilterSelections={typeFilterSelections}
        canAdd={canEdit}
        onAddExtension={onAddExtension}
        onAddExtensionForType={onAddExtensionForType}
      />
      <div className="flex-1 overflow-y-auto">
        {isAllView ? (
          orderedGroupTypeList
            .map((typeItem) => {
              const groupExtensions =
                groupedExtensions[typeItem.id] ?? [];
              return (
                <Accordion
                  key={typeItem.id}
                  defaultExpanded
                  header={
                    <AccordionHeader
                      expandIcon
                    >
                      {t(typeItem.id as any)}
                      {typeItem.unreadCount > 0
                        ? ` (${typeItem.unreadCount})`
                        : ''}
                    </AccordionHeader>
                  }
                >
                  {groupExtensions.length > 0 ? (
                    <ExtensionList
                      extensions={groupExtensions}
                      {...extensionListProps}
                    />
                  ) : (
                    <div className="px-4 py-3">
                      <Text className="typography-caption text-neutral-f04">
                        {typeItem.id === 'ParkLocation'
                          ? t('noParkLocationsYet')
                          : t('noExtensionsYet')}
                      </Text>
                    </div>
                  )}
                </Accordion>
              );
            })
        ) : extensions.length > 0 ? (
          <ExtensionList extensions={extensions} {...extensionListProps} />
        ) : (
          <div className="flex flex-col items-center mt-12 px-4 text-center">
            <Text className="typography-subheading2">
              {type === 'ParkLocation'
                ? t('noParkLocationsYet')
                : t('noExtensionsYet')}
            </Text>
            <Text className="typography-body text-neutral-f04 mt-2">
              {type === 'ParkLocation'
                ? t('allParkLocationsDescription')
                : t('allExtensionsDescription')}
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
