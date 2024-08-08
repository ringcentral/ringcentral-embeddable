import React from 'react';

import {
  RcMenuItem,
  RcSelect,
  RcSwitch,
  RcTextarea,
  RcTextField,
  RcAlert,
  RcTypography,
  RcIcon,
  RcTooltip,
} from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';
import { InfoBorder } from '@ringcentral/juno-icon';

const StyledAlert = styled(RcAlert)`
  &.RcAlert-root {
    padding: 10px;
    margin-bottom: 15px;
  }

  .RcAlert-message {
    font-size: 0.875rem;
  }
`;

const InfoIcon = styled(RcIcon)`
  margin-left: 5px;
  vertical-align: middle;
  cursor: pointer;
`;

export function SettingParamInput({
  setting,
  className,
  onChange,
}) {
  let label = setting.name;
  if (setting.description) {
    label = (
      <>
        {setting.name}
        <RcTooltip title={setting.description}>
          <InfoIcon
            symbol={InfoBorder}
            size="small"
            style={{
              marginLeft: '5px',
              verticalAlign: 'middle',
            }}
          />
        </RcTooltip>
      </>
    )
  }
  if (setting.type === 'boolean') {
    return (
      <RcSwitch
        formControlLabelProps={{
          labelPlacement: 'end',
          className: `${className} RcSwitch-formControlLabel`,
        }}
        label={label}
        checked={setting.value}
        onChange={(_, checked) => {
          onChange(checked);
        }}
      />
    );
  }
  if (setting.type === 'string') {
    return (
      <RcTextField
        label={label}
        value={setting.value}
        className={className}
        fullWidth
        placeholder={setting.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={setting.required}
        helperText={setting.helper}
      />
    );
  }
  if (setting.type === 'text') {
    return (
      <RcTextarea
        label={label}
        value={setting.value}
        minRows={2}
        className={className}
        fullWidth
        placeholder={setting.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={setting.required}
        helperText={setting.helper}
      />
    );
  }
  if (setting.type === 'option') {
    return (
      <RcSelect
        label={label}
        value={setting.value}
        fullWidth
        className={className}
        placeholder={setting.placeholder}
        onChange={(e) => {
          onChange(e.target.value);
        }}
        required={setting.required}
        helperText={setting.helper}
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
  if (setting.type === 'admonition') {
    let severity = setting.severity || 'info';
    if (['info', 'warning', 'error', 'success'].indexOf(severity) === -1) {
      severity = 'info';
      console.warn('Invalid severity value for admonition setting');
    }
    return (
      <StyledAlert severity={severity} className={className}>
        {setting.value}
      </StyledAlert>
    );
  }
  if (setting.type === 'typography') {
    return (
      <RcTypography
        variant={setting.variant || 'body1'}
        color={setting.color}
        className={className}
      >
        {setting.value}
      </RcTypography>
    );
  }
  return null;
}
