import React from 'react';

import {
  RcTypography,
} from '@ringcentral/juno';

export function Typography({
  schema,
  uiSchema,
}) {
  const variant = uiSchema && uiSchema['ui:variant'] || 'body1';
  const isBulletedList = uiSchema && uiSchema['ui:bulletedList'];
  const component = isBulletedList ? 'li' : undefined;
  const style = isBulletedList ? {} : { marginTop: '5px' };
  return (
    <RcTypography
      variant={variant}
      style={style}
      component={component}
    >
      {schema.description}
    </RcTypography>
  );
}
