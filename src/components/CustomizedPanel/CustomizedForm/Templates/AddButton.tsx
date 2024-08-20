import React from 'react';
import { RcIconButton } from '@ringcentral/juno';
import { FormContextType, IconButtonProps, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';
import { Add } from '@ringcentral/juno-icon';

export default function AddButton<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  uiSchema,
  registry,
  ...props
}: IconButtonProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <RcIconButton
      title={translateString(TranslatableString.AddItemButton)}
      {...props}
      color='primary'
      symbol={Add}
    />
  );
}