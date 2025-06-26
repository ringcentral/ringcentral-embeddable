import React, { FocusEvent } from 'react';
import {
  RcFormControlLabel as FormControlLabel,
  RcFormLabel as FormLabel,
  RcRadio as Radio,
  RcRadioGroup as RadioGroup,
  RcTabs as Tabs,
  RcTab as Tab,
  styled,
  css,
  palette2,
} from '@ringcentral/juno';

import {
  ariaDescribedByIds,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  labelValue,
  optionId,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

const StyledRadioGroup = styled(RadioGroup)<{$flexDirection: string}>`
  ${({ $flexDirection }) => $flexDirection && css`
    flex-direction: ${$flexDirection};
  `}
`;

const StyledRadio = styled(Radio)<{ $iconColor: string }>`
  .RadioButtonIcon-root {
    .MuiSvgIcon-root {
      ${
        ({ $iconColor }) => $iconColor && css`
          fill: ${$iconColor};
        `
      }
    }
  }
`;

const StyledFormLabel = styled(FormLabel)`
  font-size: 0.75rem;
`;

const StyledTabs = styled(Tabs)`
  background: ${palette2('neutral', 'b01')};
  border-bottom: 1px solid ${palette2('neutral', 'l02')};

  .RcTab-selected .tab-unread {
    color: ${palette2('tab', 'selected')};
    font-weight: 700;
  }

  .MuiTab-root {
    padding: 6px 10px;
  }
`;

export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  hideLabel,
  onChange,
  onBlur,
  onFocus,
  uiSchema,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;

  const _onChange = (_: any, value: any) => onChange(enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue));

  const row = options ? options.inline : false;
  const selectedIndex = enumOptionsIndexForValue<S>(value, enumOptions) ?? null;
  const flexDirection = uiSchema['ui:itemDirection'];
  const showValueLabel = typeof uiSchema['ui:valueLabel'] === 'undefined' ? true : uiSchema['ui:valueLabel'];
  const tabView = uiSchema['ui:tab'];
  if (tabView) {
    return (
      <StyledTabs
        value={selectedIndex}
        onChange={_onChange}
        variant="fullWidth"
      >
        {enumOptions.map((option, index) => {
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          return (
            <Tab
              key={index}
              label={option.label}
              value={String(index)}
              disabled={disabled || itemDisabled || readonly}
            />
          );
        })}
      </StyledTabs>
    );
  }
  return (
    <>
      {labelValue(
        <StyledFormLabel required={required} htmlFor={id}>
          {label || undefined}
        </StyledFormLabel>,
        hideLabel
      )}
      <StyledRadioGroup
        id={id}
        name={id}
        value={selectedIndex}
        row={row as boolean}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
        $flexDirection={flexDirection}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            const radio = (
              <FormControlLabel
                control={
                  <StyledRadio
                    name={id}
                    id={optionId(id, index)}
                    color={option.schema?.color}
                    $iconColor={option.schema?.color}
                    useRcTooltip
                    title={option.label}
                  />}
                label={showValueLabel ? option.label : undefined}
                value={String(index)}
                key={index}
                disabled={disabled || itemDisabled || readonly}
              />
            );

            return radio;
          })}
      </StyledRadioGroup>
    </>
  );
}