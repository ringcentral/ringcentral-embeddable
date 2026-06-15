import React from 'react';
import { Link as SpringLink } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown';
import { getLinkVariant } from '../utils/compat';

export function Link({
  schema,
  uiSchema = {},
  disabled,
  onFocus,
  name,
}: any) {
  const href = uiSchema['ui:href'] || undefined;
  const isBulletedList = uiSchema['ui:bulletedList'];
  const component = isBulletedList ? 'li' : 'a';
  return (
    <SpringLink
      component={component as any}
      variant={getLinkVariant(uiSchema['ui:variant'], uiSchema['ui:color'])}
      underline={uiSchema['ui:underline'] || 'hover'}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        opacity: disabled ? 0.5 : undefined,
        pointerEvents: disabled ? 'none' : undefined,
      }}
      onClick={() => {
        if (disabled) {
          return;
        }
        if (!href) {
          onFocus(name, '$$clicked');
          return;
        }
        if (component !== 'a') {
          window.open(href, '_blank');
        }
      }}
    >
      <TextWithMarkdown text={schema.description} />
    </SpringLink>
  );
}
