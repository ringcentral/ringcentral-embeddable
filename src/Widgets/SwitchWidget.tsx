import React, { CSSProperties, FocusEvent } from 'react';
import {
  FormContextType,
  ariaDescribedByIds,
  descriptionId,
  labelValue,
  RJSFSchema,
  schemaRequiresTrueValue,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Switch, Text } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown';

const switchTransformDefaults = {
  '--tw-translate-y': '0',
  '--tw-rotate': '0',
  '--tw-skew-x': '0',
  '--tw-skew-y': '0',
  '--tw-scale-x': '1',
  '--tw-scale-y': '1',
} as CSSProperties;

export default function SwitchWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    hideLabel,
    id,
    label = '',
    name,
    onBlur,
    onChange,
    onFocus,
    options,
    readonly,
    schema,
    uiSchema,
    value,
  } = props;
  const required = schemaRequiresTrueValue<S>(schema);
  const description = options.description ?? schema.description;
  const labelContent = labelValue(label, hideLabel, false);
  const isDisabled = disabled || readonly;
  const checked = typeof value === 'undefined' ? false : Boolean(value);
  const handleBlur = ({ target: { checked: nextChecked } }: FocusEvent<HTMLInputElement>) => {
    onBlur(id, nextChecked);
  };
  const handleFocus = ({ target: { checked: nextChecked } }: FocusEvent<HTMLInputElement>) => {
    onFocus(id, nextChecked);
  };
  return (
    <div className="flex w-full items-center justify-between gap-3">
      {!hideLabel ? (
        <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
          {labelContent ? (
            <Text className="typography-mainText" component="div">
              {labelContent}
            </Text>
          ) : null}
          {description ? (
            <Text
              id={descriptionId<T>(id)}
              className="typography-descriptor"
              component="div"
              style={{
                color: uiSchema?.['ui:disabled']
                  ? 'var(--sui-colors-neutral-b3)'
                  : 'var(--sui-colors-neutral-b2)',
              }}
            >
              {typeof description === 'string' ? (
                <TextWithMarkdown text={description} />
              ) : (
                description
              )}
            </Text>
          ) : null}
        </label>
      ) : null}
      <Switch
        className="shrink-0"
        rootProps={{
          style: switchTransformDefaults,
        }}
        checked={checked}
        required={required}
        disabled={isDisabled}
        autoFocus={autofocus}
        onChange={(event) => onChange(event.target.checked)}
        onBlur={handleBlur}
        onFocus={handleFocus}
        inputProps={{
          'aria-describedby': ariaDescribedByIds<T>(id),
          'aria-label': hideLabel && label ? label : undefined,
          id,
          name,
        }}
      />
    </div>
  );
}
