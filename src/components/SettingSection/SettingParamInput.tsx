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
  css,
} from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';
import { InfoBorder, Lock } from '@ringcentral/juno-icon';

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
  display: inline-block;
`;

const StyledSwitch = styled(RcSwitch)`
  ${(props) => props.readOnly && css`
    opacity: 0.5;
  `}
`;

const StyledTextField = styled(RcTextField)<{ readOnly: boolean }>`
  ${(props) => props.readOnly && css`
    .RcTextFieldInput-root {
      opacity: 0.5;
    }
  `}
`;

const StyledTextarea = styled(RcTextarea)<{ readOnly: boolean }>`
  ${(props) => props.readOnly && css`
    .RcTextareaInput-root {
      opacity: 0.5;
    }
  `}
`;

const StyledSelect = styled(RcSelect)<{ readOnly: boolean }>`
  ${(props) => props.readOnly && css`
    .RcLineSelectInput-input {
      opacity: 0.5;
    }
  `}
`;

export function SettingParamInput({
  setting,
  className,
  onChange,
}) {
  let label = setting.name;
  if (setting.description || setting.readOnly) {
    label = (
      <>
        {setting.name}
        {
          setting.description ? (
            <RcTooltip title={setting.description}>
              <InfoIcon
                symbol={InfoBorder}
                size="small"
              />
            </RcTooltip>
          ) : null
        }
        {
          setting.readOnly ? (
            <RcTooltip title={setting.readOnlyReason || ''}>
              <InfoIcon
                symbol={Lock}
                size="small"
              />
            </RcTooltip>
          ) : null
        }
      </>
    )
  }
  if (setting.type === 'boolean') {
    return (
      <StyledSwitch
        formControlLabelProps={{
          labelPlacement: 'start',
          className: `${className} RcSwitch-formControlLabel`,
          style: { marginLeft: 0, marginRight: 0 },
        }}
        label={label}
        checked={setting.value}
        onChange={(_, checked) => {
          if (setting.readOnly) {
            return;
          }
          onChange(checked);
        }}
        readOnly={setting.readOnly}
      />
    );
  }
  if (setting.type === 'string') {
    return (
      <StyledTextField
        label={label}
        value={setting.value || ''}
        className={className}
        fullWidth
        placeholder={setting.placeholder}
        onChange={(e) => {
          if (setting.readOnly) {
            return;
          }
          onChange(e.target.value);
        }}
        required={setting.required}
        helperText={setting.helper}
        aria-readonly={setting.readOnly}
        readOnly={setting.readOnly}
      />
    );
  }

  if (setting.type === 'text') {
    return (
      <StyledTextarea
        label={label}
        value={setting.value || ''}
        minRows={2}
        className={className}
        fullWidth
        placeholder={setting.placeholder}
        onChange={(e) => {
          if (setting.readOnly) {
            return;
          }
          onChange(e.target.value);
        }}
        required={setting.required}
        helperText={setting.helper}
        readOnly={setting.readOnly}
      />
    );
  }
  if (setting.type === 'option') {
    return (
      <StyledSelect
        label={label}
        value={setting.value}
        fullWidth
        className={className}
        placeholder={setting.placeholder}
        onChange={(e) => {
          if (setting.readOnly) {
            return;
          }
          onChange(e.target.value);
        }}
        required={setting.required}
        helperText={setting.helper}
        readOnly={setting.readOnly}
      >
        {setting.options.map((option) => (
          <RcMenuItem
            key={option.id}
            value={option.id}
          >
            {option.name}
          </RcMenuItem>
        ))}
      </StyledSelect>
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
        color={setting.color || 'neutral.f06'}
        className={className}
      >
        {setting.value}
      </RcTypography>
    );
  }
  return null;
}
