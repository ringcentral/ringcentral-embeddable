import React, { useState } from 'react';
import {
  palette2,
  styled,
  RcList,
  RcTypography,
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

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  width: 100%;
  margin-top: 50px;
  padding: 0 16px;
  text-align: center;
`;

const EmptyStateDescription = styled(RcTypography)`
  font-size: 13px;
`;

function EmptyState({
  type,
}) {
  return (
    <EmptyStateContainer>
      <RcTypography variant="subheading2">
        {
          type === 'ParkLocation' ?
          'No park locations yet' :
          'No extensions yet'
        }
      </RcTypography>
      <br />
      <EmptyStateDescription variant="body1">
        {
          type === 'ParkLocation' ?
          'All park locations added to HUD will show up here' :
          'All extensions added to HUD will appear here.'
        }
      </EmptyStateDescription>
    </EmptyStateContainer>
  );
}

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
  canEdit,
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
        canAdd={canEdit}
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
              canEdit={canEdit}
            />
          ))}
        </RcList>
      </ListRoot>
      {
        extensions.length === 0 && (
          <EmptyState
            type={type}
          />
        )
      }
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