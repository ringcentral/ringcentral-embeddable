import React from 'react';
import { SearchLine } from '../SearchLine';

import {
  styled,
  palette2,
  RcListItemText,
  RcPlainSelect,
  RcListItem,
  RcText,
  RcIcon,
  RcBadge,
} from '@ringcentral/juno';
import { ArrowDown2, ArrowUp2 } from '@ringcentral/juno-icon';
import i18n from './i18n';

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  margin: 0 16px;

  &:hover {
    border-bottom: 1px solid ${palette2('neutral', 'l03')};
  }

  &:focus-within {
    border-bottom: 1px solid ${palette2('interactive', 'b02')};
  }
`;

const StyledSearchLine = styled(SearchLine)`
  flex: 1;
  padding: 0;

  .MuiInput-underline:hover:not(.Mui-disabled):before {
    border-bottom: none;
  }

  .RcTextFieldInput-underline:before {
    border-bottom: none;
  }

  .MuiInput-underline:after {
    border-bottom: none;
  }
`;

const StyledBadge = styled(RcBadge)`
  .RcBadge-badge {
    width: 12px;
    height: 12px;
  }
`;

function TypeFilter({
  type,
  onTypeChange,
  typeList,
  currentLocale,
}) {
  const unreadCount = typeList.reduce((acc, item) => {
    return acc + item.unreadCount;
  }, 0);
  return (
    <RcPlainSelect
      value={type}
      onChange={(e) => onTypeChange(e.target.value)}
      color="action.grayLight"
      renderValue={(value) => {
        const label = i18n.getString(value, currentLocale);
        return (
          <RcText
            variant="caption1"
            color="action.grayLight"
          >
            {label?.toUpperCase() || ''}
          </RcText>
        );
      }}
      IconComponent={({ open }) => {
        return (
          <StyledBadge variant="dot" badgeContent={unreadCount}>
            <RcIcon
              symbol={open ? ArrowUp2 : ArrowDown2}
              size="small"
              color="action.grayLight"
            />
          </StyledBadge>
        );
      }}
    >
      {
        typeList.map((t) => (
          <RcListItem value={t.id}>
            <RcListItemText
              primary={
                `${i18n.getString(t.id, currentLocale)} ${t.unreadCount > 0 ? `(${t.unreadCount})` : ''}`
              }
            />
          </RcListItem>
        ))
      }
    </RcPlainSelect>
  );
}

export function SearchAndFilter({
  searchInput,
  onSearchInputChange,
  disableLinks = false,
  placeholder,
  currentLocale,
  type,
  onTypeChange,
  showTypeFilter = true,
  typeList,
}) {
  return (
    <Container>
      <StyledSearchLine
        searchInput={searchInput}
        onSearchInputChange={(e) => onSearchInputChange(e.target.value)}
        placeholder={placeholder}
        disableLinks={disableLinks}
      />
      {
        showTypeFilter && (
          <TypeFilter
            type={type}
            onTypeChange={onTypeChange}
            typeList={typeList}
            currentLocale={currentLocale}
          />
        )
      }
    </Container>
  );
}
