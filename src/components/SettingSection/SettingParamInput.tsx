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
  RcFormLabel,
  RcFormGroup,
  RcCheckbox,
  css,
} from '@ringcentral/juno';
import { styled, palette2 } from '@ringcentral/juno/foundation';
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

const StyledSwitchLabelWrapper = styled.span`
  display: inline-flex;
  flex-direction: column;
`;

const StyledSwitchLabel = styled(RcTypography)`
  font-size: 0.875rem;
`;

const CheckboxSelectWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledFormLabel = styled(RcFormLabel)`
  font-size: 0.75rem;
  color: ${palette2('neutral', 'f05')};
`;

const StyledFormGroup = styled(RcFormGroup)`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`;

function CheckboxSelect({
  value,
  label,
  options,
  onChange,
  required,
  className,
  readOnly,
  multiple,
  disabled,
  helperText,
}) {
  let currentValue = value;
  if (multiple && !Array.isArray(value)) {
    currentValue = [];
  }
  return (
    <CheckboxSelectWrapper className={className}>
      <StyledFormLabel required={required}>{label}</StyledFormLabel>
      {helperText && (
        <RcTypography variant='caption1' color="neutral.f04" component="span">
          {helperText}
        </RcTypography>
      )}
      <StyledFormGroup>
        {options.map((option) => {
          const checked = multiple ? currentValue.includes(option.id) : currentValue === option.id;
          const itemDisabled = disabled || option.disabled;
          return (
            <RcCheckbox
              formControlLabelProps={{
                labelPlacement: 'end',
              }}
              label={option.name}
              key={option.id}
              id={option.id}
              name={option.id}
              checked={checked}
              disabled={itemDisabled || readOnly}
              onChange={(_, checked) => {
                if (readOnly) {
                  return;
                }
                if (multiple) {
                  if (checked) {
                    onChange([...currentValue, option.id]);
                  } else {
                    onChange(currentValue.filter((v) => v !== option.id));
                  }
                  return;
                }
                if (checked) {
                  onChange(option.id);
                } else {
                  onChange(null);
                }
              }}
            />
          )
        })}
      </StyledFormGroup>
    </CheckboxSelectWrapper>
  );
}
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
          setting.description && setting.type !== 'boolean' ? (
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
    if (setting.description) {
      label = (
        <StyledSwitchLabelWrapper>
          <StyledSwitchLabel variant='body1' component="span">{label}</StyledSwitchLabel>
          <RcTypography variant='caption1' component="span" color="neutral.f04">{setting.description}</RcTypography>
        </StyledSwitchLabelWrapper>
      );
    }
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
    if (setting.checkbox) {
      return (
        <CheckboxSelect
          label={label}
          value={setting.value}
          options={setting.options}
          onChange={onChange}
          required={setting.required}
          className={className}
          readOnly={setting.readOnly}
          multiple={setting.multiple}
          disabled={setting.disabled}
          helperText={setting.helper}
        />
      );
    }
    return (
      <StyledSelect
        label={label}
        value={setting.value}
        fullWidth
        className={className}
        placeholder={setting.placeholder}
        multiple={setting.multiple}
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
