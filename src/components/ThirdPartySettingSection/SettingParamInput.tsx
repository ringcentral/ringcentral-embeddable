import React from 'react';

import {
  RcMenuItem,
  RcSelect,
  RcSwitch,
  RcTextarea,
  RcTextField,
} from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';

export function SettingParamInput({
  setting,
  className,
  onChange,
}) {
  if (setting.type === 'boolean') {
    return (
      <RcSwitch
        formControlLabelProps={{
          labelPlacement: 'end',
        }}
        label={setting.name}
        checked={setting.value}
        className={className}
        onChange={(_, checked) => {
          onChange(checked);
        }}
      />
    );
  }
  if (setting.type === 'string') {
    return (
      <RcTextField
        label={setting.name}
        value={setting.value}
        className={className}
        fullWidth
        placeholder={setting.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={setting.required}
      />
    );
  }
  if (setting.type === 'text') {
    return (
      <RcTextarea
        label={setting.name}
        value={setting.value}
        minRows={2}
        className={className}
        fullWidth
        placeholder={setting.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={setting.required}
      />
    );
  }
  if (setting.type === 'option') {
    return (
      <RcSelect
        label={setting.name}
        value={setting.value}
        fullWidth
        className={className}
        placeholder={setting.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={setting.required}
      >
        {setting.options.map((option) => (
          <RcMenuItem
            key={option.id}
            value={option.id}
          >
            {option.name}
          </RcMenuItem>
        ))}
      </RcSelect>
    );
  }
  return null;
}
