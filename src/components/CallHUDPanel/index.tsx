import React, { useState } from 'react';
import {
  palette2,
  styled,
  RcList,
} from '@ringcentral/juno';
import { SearchAndFilter } from './SearchAndFilter';
import { ExtensionItem } from './ExtensionItem';
import { AddExtensionDialog } from './AddExtensionDialog';

const Root = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const ListRoot = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  overflow: auto;
  background-color: ${palette2('neutral', 'b01')};
  flex: 1;
`;

export const CallHUDPanel = ({
  searchInput,
  onSearchInputChange,
  currentLocale,
  type,
  onTypeChange,
  typeList,
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
  allExtensions,
  onAddExtensions,
  extensionAddFilter,
  onExtensionAddFilterChange,
  onRemoveExtension,
}) => {
  const [openAddExtensionDialog, setOpenAddExtensionDialog] = useState(false);

  return (
    <Root
      data-sign="callHUDPanel"
      className="CallHUDPanel_container"
    >
      <SearchAndFilter
        searchInput={searchInput}
        onSearchInputChange={onSearchInputChange}
        placeholder="Search"
        currentLocale={currentLocale}
        type={type}
        onTypeChange={onTypeChange}
        showTypeFilter
        typeList={typeList}
        onAddExtension={() => setOpenAddExtensionDialog(true)}
      />
      <ListRoot>
        <RcList>
          {extensions.map((extension) => (
            <ExtensionItem
              key={extension.id}
              item={extension}
              formatPhone={formatPhone}
              currentLocale={currentLocale}
              onClickToDial={onClickToDial}
              disableClickToDial={disableClickToDial}
              canPark={canPark}
              onPark={onPark}
              onText={onText}
              pickParkLocation={pickParkLocation}
              pickGroupCall={pickGroupCall}
              pickCallQueueCall={pickCallQueueCall}
              onRemoveExtension={onRemoveExtension}
            />
          ))}
        </RcList>
      </ListRoot>
      {
        (type === 'User' || type === 'ParkLocation') && (
          <AddExtensionDialog
            type={type}
            open={openAddExtensionDialog}
            onClose={() => setOpenAddExtensionDialog(false)}
            onAdd={onAddExtensions}
            allExtensions={allExtensions}
            extensionAddFilter={extensionAddFilter}
            onExtensionAddFilterChange={onExtensionAddFilterChange}
          />
        )
      }
    </Root>
  );
}