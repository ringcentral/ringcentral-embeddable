import React from 'react';
import { RcFormHelperText } from '@ringcentral/juno';
import { helpId, FieldHelpProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function FieldHelpTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldHelpProps<T, S, F>) {
  const { idSchema, help } = props;
  if (!help) {
    return null;
  }
  const id = helpId<T>(idSchema);
  return <RcFormHelperText id={id}>{help}</RcFormHelperText>;
}