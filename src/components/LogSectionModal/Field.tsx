import React from 'react';

import {
  RcMenuItem,
  RcSelect,
  RcSwitch,
  RcTextarea,
  RcTextField,
  RcListItemText,
  RcAlert,
  styled,
} from '@ringcentral/juno';

const StyledTextarea = styled(RcTextarea)`
  .RcTextFieldInput-input {
    font-size: 0.875rem;
  }
`;

const StyledAlert = styled(RcAlert)`
  &.RcAlert-root {
    padding: 10px;
  }

  .RcAlert-message {
    font-size: 0.875rem;
  }
`;

export function Field({
  field,
  className,
  onChange,
  value,
}) {
  if (field.type === 'input.boolean') {
    return (
      <RcSwitch
        formControlLabelProps={{
          labelPlacement: 'end',
        }}
        label={field.label}
        checked={value}
        className={className}
        onChange={(_, checked) => {
          onChange(checked);
        }}
      />
    );
  }
  if (field.type === 'input.string') {
    return (
      <RcTextField
        label={field.label}
        value={value}
        className={className}
        fullWidth
        placeholder={field.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={field.required}
      />
    );
  }
  if (field.type === 'input.text') {
    return (
      <StyledTextarea
        label={field.label}
        value={value}
        minRows={2}
        className={className}
        fullWidth
        placeholder={field.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={field.required}
        maxRows={10}
      />
    );
  }
  if (field.type === 'input.choice') {
    return (
      <RcSelect
        label={field.label}
        value={value}
        fullWidth
        className={className}
        placeholder={field.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={field.required}
      >
        {field.options.map((option) => (
          <RcMenuItem
            key={option.id}
            value={option.id}
          >
            <RcListItemText
              primary={option.name}
              secondary={option.description}
            />
          </RcMenuItem>
        ))}
      </RcSelect>
    );
  }
  if (field.type.indexOf('admonition.') === 0) {
    return (
      <StyledAlert
        severity={field.type === 'admonition.warn' ? 'warning' : 'info'}
        className={className}
      >
        {field.text}
      </StyledAlert>
    );
  }
  return null;
}
