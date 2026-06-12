import { Text } from '@ringcentral/spring-ui';
import {
  FieldHelpProps,
  FormContextType,
  helpId,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';
import React from 'react';
import { TextWithMarkdown } from '../components/TextWithMarkdown';

export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ help, idSchema }: FieldHelpProps<T, S, F>) {
  if (!help) {
    return null;
  }
  return (
    <Text
      id={helpId<T>(idSchema)}
      className="typography-descriptor"
      component="div"
      style={{ color: 'var(--sui-colors-neutral-b2)' }}
    >
      {typeof help === 'string' ? <TextWithMarkdown text={help} /> : help}
    </Text>
  );
}
