import React, { useRef, useState } from 'react';
import {
  Button as SpringButton,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuItemText,
  TextField,
} from '@ringcentral/spring-ui';
import { CaretDownMd, SearchMd } from '@ringcentral/spring-icon';

function TypeFilter({
  type,
  onTypeChange,
  typeList,
  previewLength = 2,
}: {
  type: string;
  onTypeChange: (type: string) => void;
  previewLength?: number;
  typeList: string[];
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  let previewTypes = typeList.slice(0, previewLength);
  let restTypes = typeList.slice(previewLength);
  if (previewLength === 1) {
    previewTypes = [type];
    restTypes = typeList;
  } else if (previewTypes.indexOf(type) === -1) {
    const lastPreviewType = previewTypes[previewTypes.length - 1];
    previewTypes[previewTypes.length - 1] = type;
    restTypes = [lastPreviewType, ...restTypes.filter((item) => item !== type)];
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {previewTypes.map((item) => (
        <SpringButton
          key={item}
          variant="text"
          size="xsmall"
          color={type === item ? 'primary' : 'neutral'}
          onClick={() => onTypeChange(item)}
        >
          {item}
        </SpringButton>
      ))}
      {restTypes.length > 0 ? (
        <>
          <IconButton
            ref={anchorRef}
            symbol={CaretDownMd}
            variant="icon"
            size="xsmall"
            onClick={() => setIsMenuOpen(true)}
            label="More filters"
          />
          <Menu open={isMenuOpen} anchorEl={anchorRef.current} onClose={() => setIsMenuOpen(false)}>
            {restTypes.map((item) => (
              <MenuItem
                key={item}
                onClick={() => {
                  onTypeChange(item);
                  setIsMenuOpen(false);
                }}
                selected={type === item}
              >
                <MenuItemText primary={item} />
              </MenuItem>
            ))}
          </Menu>
        </>
      ) : null}
    </div>
  );
}

export function Search({
  uiSchema,
  formData,
  disabled,
  onChange,
}: any) {
  const placeholder = uiSchema['ui:placeholder'] || 'Search';
  const filterTypes = uiSchema['ui:filters'] || [];
  if (filterTypes.length > 0) {
    const searchText = formData ? formData.search : '';
    let previewLength = searchText.length > 0 ? 1 : 2;
    if (uiSchema['ui:previewLength']) {
      previewLength = uiSchema['ui:previewLength'];
    }
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <TextField
          variant="outlined"
          value={searchText}
          disabled={disabled}
          startAdornment={<Icon symbol={SearchMd} size="small" />}
          placeholder={placeholder}
          onChange={(event) => onChange({ ...formData, search: event.target.value })}
          fullWidth
          clearBtn={false}
        />
        <TypeFilter
          type={formData ? formData.filter : ''}
          onTypeChange={(filter) => onChange({ ...formData, filter })}
          typeList={filterTypes}
          previewLength={previewLength}
        />
      </div>
    );
  }
  return (
    <TextField
      variant="outlined"
      value={formData || ''}
      disabled={disabled}
      startAdornment={<Icon symbol={SearchMd} size="small" />}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      fullWidth
      clearBtn={false}
    />
  );
}
