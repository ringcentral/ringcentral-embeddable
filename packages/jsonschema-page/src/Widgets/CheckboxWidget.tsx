import React, { FocusEvent } from 'react';
import type { ReactNode } from 'react';
import {
  RcSwitch,
  styled,
  css,
}from '@ringcentral/juno';
import {
  ariaDescribedByIds,
  descriptionId,
  getTemplate,
  labelValue,
  schemaRequiresTrueValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';

const SwitchContainer = styled.div`
  width: 100%;

  .MuiFormControlLabel-label {
    flex: 1;
  }

  .MuiFormControlLabel-root {
    margin-left: 0;
    width: 100%;
  }

  .RcSwitch-root {
    margin: 2px;
  }
`;

const StyledSwitch = styled(RcSwitch)`
  ${(props) => props.readOnly && css`
    opacity: 0.5;
  `}
`;

const StyledSwitchLabelWrapper = styled.span`
  display: inline-flex;
  flex-direction: column;
`;

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    schema,
    id,
    value,
    disabled,
    readonly,
    label = '',
    hideLabel,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    registry,
    options,
    uiSchema,
  } = props;
  const DescriptionFieldTemplate = getTemplate<'DescriptionFieldTemplate', T, S, F>(
    'DescriptionFieldTemplate',
    registry,
    options
  );
  // Because an unchecked checkbox will cause html5 validation to fail, only add
  // the "required" attribute if the field value must be "true", due to the
  // "const" or "enum" keywords
  const required = schemaRequiresTrueValue<S>(schema);

  const _onChange = (_: any, checked: boolean) => onChange(checked);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLButtonElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLButtonElement>) => onFocus(id, value);
  const description = options.description ?? schema.description;
  let labelNode: ReactNode = labelValue(label, hideLabel, false);
  if (!hideLabel && !!description) {
    labelNode = (
      <StyledSwitchLabelWrapper>
        {labelNode}
        <DescriptionFieldTemplate
          id={descriptionId<T>(id)}
          description={description}
          schema={schema}
          uiSchema={uiSchema}
          registry={registry}
        />
      </StyledSwitchLabelWrapper>
    );
  }
  return (
    <>
      <SwitchContainer>
        <StyledSwitch
          id={id}
          name={id}
          checked={typeof value === 'undefined' ? false : Boolean(value)}
          required={required}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={_onChange}
          onBlur={_onBlur}
          onFocus={_onFocus}
          aria-describedby={ariaDescribedByIds<T>(id)}
          formControlLabelProps={{
            labelPlacement: 'start',
          }}
          label={labelNode}
          readOnly={readonly}
        />
      </SwitchContainer>
    </>
  );
}
