import React, { CSSProperties } from 'react';
import { Text } from '@ringcentral/spring-ui';
import {
  DescriptionFieldProps,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { TextWithMarkdown } from '../components/TextWithMarkdown';

type DescriptionFieldExtraProps = {
  style?: CSSProperties;
};

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: DescriptionFieldProps<T, S, F> & DescriptionFieldExtraProps) {
  const { id, description, style = {}, uiSchema = {} } = props;
  if (!description) {
    return null;
  }
  const isDisabled = uiSchema['ui:disabled'] || false;
  return (
    <Text
      id={id}
      className="typography-descriptor"
      component="div"
      style={{
        color: isDisabled ? 'var(--sui-colors-neutral-b3)' : 'var(--sui-colors-neutral-b2)',
        ...style,
      }}
    >
      {typeof description === 'string' ? <TextWithMarkdown text={description} /> : description}
    </Text>
  );
}
