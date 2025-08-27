import React, { useState } from 'react';

import {
  RcIcon,
  RcIconButton,
  RcTextField,
  styled,
  palette2,
  RcMenu,
  RcMenuItem,
  RcListItemText,
  RcButton,
} from '@ringcentral/juno';
import { Search as SearchIcon, ArrowDown2 } from '@ringcentral/juno-icon';

const StyledTextField = styled(RcTextField)`
  &.RcTextField-root {
    margin-bottom: 0;
  }

  .RcTextFieldInput-input::placeholder {
    font-size: 0.875rem;
  }
`;

const StyledSearch = styled(StyledTextField)`
  &.RcTextField-root {
    flex: 1;
  }

  .RcTextFieldInput-input {
    font-size: 0.75rem;
    line-height: 16px;
    margin-left: 8px;
  }

  .RcTextFieldInput-root {
    padding: 5px 0;
  }

  .RcOutlineTextFieldInput-root::before {
    box-shadow: none;
  }

  .RcOutlineTextFieldInput-root:not(.RcOutlineTextFieldInput-focused):not(.RcOutlineTextFieldInput-disabled):hover {
    background: ${palette2('neutral', 'b01')};
  }

  .MuiInput-underline:hover:not(.Mui-disabled):before {
    border-bottom: none;
  }

  .MuiInput-underline:after {
    border-bottom: none;
  }

  .RcTextFieldInput-underline:before {
    border-bottom: none;
  }

  .RcTextFieldInput-input::placeholder {
    font-size: 0.75rem;
  }
`;

const SearchAndFilterContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};

  &:hover {
    border-bottom: 1px solid ${palette2('neutral', 'l03')};
  }

  &:focus-within {
    border-bottom: 1px solid ${palette2('interactive', 'b02')};
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
  previewLength = 2,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  let previewTypes = typeList.slice(0, previewLength);
  let restTypes = typeList.slice(previewLength);
  if (previewLength === 1) {
    previewTypes = [type];
    restTypes = typeList;
  } else if (previewTypes.indexOf(type) === -1) {
    const lastPreviewType = previewTypes[previewTypes.length - 1];
    previewTypes[previewTypes.length - 1] = type;
    restTypes = restTypes.filter((t) => t !== type);
    restTypes = [lastPreviewType, ...restTypes];
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
          {t}
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
                      primary={t}
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

export function Search({
  uiSchema,
  formData,
  disabled,
  onChange,
}) {
  const placeholder = uiSchema['ui:placeholder'] || 'Search';
  const helperText = uiSchema['ui:helpText'] || '';
  const filterTypes = uiSchema['ui:filters'] || [];
  if (filterTypes.length > 0) {
    const searchText = formData ? formData.search : '';
    let previewLength = searchText.length > 0 ? 1 : 2;
    if (uiSchema['ui:previewLength']) {
      previewLength = uiSchema['ui:previewLength'];
    }
    return (
      <SearchAndFilterContainer>
        <StyledSearch
          variant="outline"
          value={searchText}
          disabled={disabled}
          InputProps={{
            startAdornment: <RcIcon symbol={SearchIcon} size="small" />,
          }}
          placeholder={placeholder}
          onChange={(e) => onChange({
            ...formData,
            search: e.target.value,
          })}
          fullWidth
        />
        <TypeFilter
          type={formData ? formData.filter : ''}
          onTypeChange={(filter) => onChange({
            ...formData,
            filter,
          })}
          typeList={filterTypes}
          previewLength={previewLength}
        />
      </SearchAndFilterContainer>
    );
  }
  return (
    <StyledTextField
      variant="outline"
      value={formData}
      disabled={disabled}
      size="small"
      radius="round"
      InputProps={{
        startAdornment: <RcIcon symbol={SearchIcon} size="small" />,
      }}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      fullWidth
      gutterBottom
      helperText={helperText}
    />
  )
}
