import React from 'react';

import { styled } from '@ringcentral/juno/foundation';
import { RcIcon, RcTextField } from '@ringcentral/juno';
import { Search as SearchIcon } from '@ringcentral/juno-icon';

const StyledTextField = styled(RcTextField)`
  &.RcTextField-root {
    margin-bottom: 0;
  }

  .RcTextFieldInput-input::placeholder {
    font-size: 0.875rem;
  }
`;

export function Search({
  uiSchema,
  formData,
  disabled,
  onChange,
}) {
  const placeholder = uiSchema['ui:placeholder'] || 'Search';
  const helperText = uiSchema['ui:helpText'] || '';
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
