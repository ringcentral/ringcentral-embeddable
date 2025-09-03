import React, { useState } from 'react';
import { SearchLine } from '../SearchLine';

import {
  styled,
  palette2,
  RcButton,
  RcMenu,
  RcMenuItem,
  RcListItemText,
  RcIconButton,
} from '@ringcentral/juno';
import { ArrowDown2 } from '@ringcentral/juno-icon';
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

const StyledTypeFilterRoot = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledFilterIcon = styled(RcIconButton)`
  .icon {
    font-size: 1rem;
  }
`;

function TypeFilter({
  type,
  onTypeChange,
  typeList,
  currentLocale,
  previewLength = 2,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  let previewTypes = typeList.slice(0, previewLength);
  let restTypes = typeList.slice(previewLength);
  if (previewLength == 1) {
    previewTypes = [type];
    restTypes = typeList;
  } else if (previewTypes.indexOf(type) === -1) {
    previewTypes = ['All', type];
    restTypes = typeList.filter((t) => t !== type && t !== 'All');
  }
  return (
    <StyledTypeFilterRoot>
      {previewTypes.map((t) => (
        <RcButton
          key={t}
          variant='text'
          size="xsmall"
          color={type === t ? 'action.primary' : 'neutral.f05'}
          onClick={() => onTypeChange(t)}
        >
          {(i18n.getString(t, currentLocale)).toUpperCase()}
        </RcButton>
      ))}
      {
        restTypes.length > 0 && (
          <>
            <StyledFilterIcon
              symbol={ArrowDown2}
              variant='round'
              radius={4}
              size="xsmall"
              innerRef={setAnchorEl}
              onClick={() => {
                setMenuOpen(true);
              }}
            />
            <RcMenu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
            >
              {
                restTypes.map((t) => (
                  <RcMenuItem
                    key={t}
                    onClick={() => {
                      onTypeChange(t);
                      setMenuOpen(false);
                    }}
                    selected={type === t}
                  >
                    <RcListItemText
                      primary={i18n.getString(t, currentLocale)}
                    />
                  </RcMenuItem>
                ))
              }
            </RcMenu>
          </>
        )
      }
    </StyledTypeFilterRoot>
  );
}

export const CALL_TYPE_LIST = ['All', 'Missed', 'Inbound', 'Outbound'];
export const CALL_TYPE_LIST_WITH_UN_LOGGED = ['All', 'UnLogged', 'Logged', 'Missed', 'Inbound', 'Outbound'];
export const MESSAGE_TYPE_LIST = ['All', 'Unread'];
export const MESSAGE_TYPE_LIST_WITH_UN_LOGGED = ['All', 'UnLogged', 'Unread'];

export function SearchAndFilter({
  searchInput,
  onSearchInputChange,
  disableLinks,
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
            previewLength={searchInput.length > 0 ? 1 : 2}
          />
        )
      }
    </Container>
  );
}
