import React, { ChangeEvent, FocusEvent, SyntheticEvent } from 'react';
import {
  FormLabel,
  Radio,
  RadioGroup,
  Tab,
  TabContext,
  Tabs,
} from '@ringcentral/spring-ui';
import {
  ariaDescribedByIds,
  EnumOptionsType,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

const RADIO_GROUP_LABEL_ROOT_STYLE: React.CSSProperties = {
  marginBottom: 'var(--sui-spacing-2)',
};

type RadioColorStyle = React.CSSProperties & {
  '--s-primary-f'?: string;
  '--s-primary-f-high-contrast'?: string;
  '--s-primary-f-opacity'?: string;
  '--s-primary-f-high-contrast-opacity'?: string;
};

type RadioOptionSchema = StrictRJSFSchema & {
  color?: unknown;
};

type RadioColorValue = {
  color: string;
  channels: string;
};

function getHexColorValue(color: unknown): RadioColorValue | undefined {
  if (typeof color !== 'string') {
    return undefined;
  }
  const hexColor = color.trim();
  const shortHexColorMatch = /^#([0-9a-f]{3})$/i.exec(hexColor);
  const longHexColorMatch = /^#([0-9a-f]{6})$/i.exec(hexColor);
  const hexValue = shortHexColorMatch
    ? shortHexColorMatch[1].replace(/[0-9a-f]/gi, (value) => value + value)
    : longHexColorMatch?.[1];
  if (!hexValue) {
    return undefined;
  }
  const red = Number.parseInt(hexValue.slice(0, 2), 16);
  const green = Number.parseInt(hexValue.slice(2, 4), 16);
  const blue = Number.parseInt(hexValue.slice(4, 6), 16);
  return {
    color: hexColor,
    channels: `${red}, ${green}, ${blue}`,
  };
}

function getRadioOptionColorStyle<S extends StrictRJSFSchema>(
  option: EnumOptionsType<S>,
): RadioColorStyle | undefined {
  const optionSchema = option.schema as RadioOptionSchema | undefined;
  const colorValue = getHexColorValue(optionSchema?.color);
  if (!colorValue) {
    return undefined;
  }
  return {
    '--s-primary-f': colorValue.channels,
    '--s-primary-f-high-contrast': colorValue.channels,
    '--s-primary-f-opacity': '1',
    '--s-primary-f-high-contrast-opacity': '1',
    borderColor: colorValue.color,
  };
}

export default function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
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
  uiSchema = {},
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;
  const rawSelectedIndex = enumOptionsIndexForValue<S>(value, enumOptions);
  const selectedIndex = Array.isArray(rawSelectedIndex)
    ? rawSelectedIndex[0]
    : rawSelectedIndex;
  const selectedValue = selectedIndex ?? null;
  const fieldLabel = labelValue(label, hideLabel, false);
  const handleChange = (nextValue: unknown) => {
    onChange(enumOptionsValueForIndex<S>(String(nextValue), enumOptions, emptyValue));
  };
  const handleTabChange = (_event: SyntheticEvent | null, nextValue: string | number | null) => {
    handleChange(nextValue);
  };
  const handleBlur = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) =>
    onBlur(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  const handleFocus = ({ target: { value: nextValue } }: FocusEvent<HTMLInputElement>) =>
    onFocus(id, enumOptionsValueForIndex<S>(nextValue, enumOptions, emptyValue));
  if (uiSchema['ui:tab']) {
    return (
      <TabContext value={selectedValue} onChange={handleTabChange}>
        <Tabs
          variant="standard"
          size="medium"
        >
          {Array.isArray(enumOptions) &&
            enumOptions.map((option, index) => {
              const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
              return (
                <Tab
                  key={index}
                  id={`${id}__tab-${index}`}
                  label={option.label}
                  value={String(index)}
                  disabled={disabled || itemDisabled || readonly}
                />
              );
            })}
        </Tabs>
      </TabContext>
    );
  }
  return (
    <>
      {fieldLabel ? (
        <FormLabel
          id={id}
          label={required ? `${fieldLabel} *` : fieldLabel}
          rootProps={{
            style: RADIO_GROUP_LABEL_ROOT_STYLE,
          }}
        />
      ) : null}
      <RadioGroup
        id={id}
        name={id}
        value={selectedIndex}
        row={!!options.inline}
        onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange(event.target.value)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
        style={{ flexDirection: uiSchema['ui:itemDirection'] }}
      >
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index) => {
            const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
            const showValueLabel = typeof uiSchema['ui:valueLabel'] === 'undefined' ? true : uiSchema['ui:valueLabel'];
            const radioColorStyle = getRadioOptionColorStyle<S>(option);
            return (
              <FormLabel
                key={index}
                label={showValueLabel ? option.label : undefined}
                value={String(index)}
                disabled={disabled || itemDisabled || readonly}
              >
                <Radio
                  name={id}
                  rootProps={
                    radioColorStyle
                      ? {
                        style: radioColorStyle,
                      }
                      : undefined
                  }
                />
              </FormLabel>
            );
          })}
      </RadioGroup>
    </>
  );
}
