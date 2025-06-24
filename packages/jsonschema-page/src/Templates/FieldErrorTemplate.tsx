import React from 'react';
import {
  RcListItem as ListItem,
  RcFormHelperText as FormHelperText,
  RcList as List,
} from '@ringcentral/juno';

import { errorId, FieldErrorProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function FieldErrorTemplate<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: FieldErrorProps<T, S, F>) {
  const { errors = [], idSchema } = props;
  if (errors.length === 0) {
    return null;
  }
  const id = errorId<T>(idSchema);

  return (
    <List dense={true} disablePadding={true}>
      {errors.map((error, i: number) => {
        return (
          <ListItem key={i} disableGutters={true}>
            <FormHelperText id={id}>{error}</FormHelperText>
          </ListItem>
        );
      })}
    </List>
  );
}
