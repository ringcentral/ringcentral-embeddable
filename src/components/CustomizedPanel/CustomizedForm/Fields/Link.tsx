import React from 'react';

import {
  RcLink,
} from '@ringcentral/juno';

export function Link({
  schema,
  uiSchema = {},
}) {
  const variant = uiSchema['ui:variant'] || undefined;
  const color = uiSchema['ui:color'] || undefined;
  const underline = uiSchema['ui:underline'] || undefined;
  const href = uiSchema['ui:href'] || undefined;
  return (
    <RcLink
      variant={variant}
      color={color}
      underline={underline}
      href={href}
      target="_blank"
    >
      {schema.description}
    </RcLink>
  );
}
