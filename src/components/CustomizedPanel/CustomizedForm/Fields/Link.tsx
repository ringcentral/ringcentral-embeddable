import React from 'react';

import {
  RcLink,
} from '@ringcentral/juno';

export function Link({
  schema,
  uiSchema = {},
  disabled,
  onFocus,
  name,
}) {
  const variant = uiSchema['ui:variant'] || undefined;
  const color = uiSchema['ui:color'] || undefined;
  const underline = uiSchema['ui:underline'] || undefined;
  const href = uiSchema['ui:href'] || undefined;
  const component = uiSchema['ui:bulletedList'] ? 'li' : 'a';
  return (
    <RcLink
      Component={component}
      variant={variant}
      color={color}
      underline={underline}
      href={href}
      target="_blank"
      disabled={disabled}
      onClick={() => {
        if (!href) {
          // If no href, treat as a button
          onFocus(name, '$$clicked');
          return;
        }
        if (component !== 'a') {
          // Open in new tab if not an anchor tag
          window.open(href, '_blank');
        }
      }}
    >
      {schema.description}
    </RcLink>
  );
}
