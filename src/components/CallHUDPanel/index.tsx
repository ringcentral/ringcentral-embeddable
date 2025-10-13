import React from 'react';

import { palette2, styled } from '@ringcentral/juno';
import { SearchAndFilter } from '../SearchAndFilter';

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
        typePreviewLength={1}
      />
    </Root>
  );
}