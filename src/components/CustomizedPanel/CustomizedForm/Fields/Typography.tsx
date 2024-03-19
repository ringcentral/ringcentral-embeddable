import React from 'react';

import {
  RcTypography,
} from '@ringcentral/juno';

export function Typography({
  schema,
  uiSchema,
}) {
  return (
    <RcTypography
      variant={uiSchema && uiSchema['ui:variant'] || 'body1'}
      style={{ marginTop: '5px' }}
    >
      {schema.description}
    </RcTypography>
  );
}
