import React from 'react';

import {
  RcButton,
} from '@ringcentral/juno';

export function Button({
  schema,
  uiSchema = {},
  onFocus,
  disabled,
  name,
}) {
  return (
    <RcButton
      variant={uiSchema['ui:variant'] || 'contained'}
      onClick={() => {
        onFocus(name, '$$clicked');
      }}
      fullWidth={uiSchema['ui:fullWidth']}
      disabled={disabled}
      color={uiSchema['ui:color'] || 'primary'}
    >
      {schema.title}
    </RcButton>
  );
}
