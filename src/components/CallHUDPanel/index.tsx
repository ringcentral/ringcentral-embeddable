import React from 'react';
import {
  palette2,
  styled,
  RcList,
} from '@ringcentral/juno';
import { SearchAndFilter } from './SearchAndFilter';
import { ExtensionItem } from './ExtensionItem';

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
}) => {
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
            />
          ))}
        </RcList>
      </ListRoot>
    </Root>
  );
}