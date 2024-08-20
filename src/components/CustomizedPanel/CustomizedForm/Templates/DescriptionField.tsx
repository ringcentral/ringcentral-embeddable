import React from 'react';
import { RcTypography } from '@ringcentral/juno';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description } = props;
  if (description) {
    return (
      <RcTypography id={id} variant="body1" style={{ marginTop: '5px' }}>
        {description}
      </RcTypography>
    );
  }

  return null;
}