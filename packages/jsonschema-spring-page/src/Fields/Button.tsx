import React from 'react';
import { Button as SpringButton } from '@ringcentral/spring-ui';
import { getButtonColor, getButtonVariant } from '../utils/compat';

export function Button({
  schema,
  uiSchema = {},
  onFocus,
  disabled,
  name,
}: any) {
  return (
    <SpringButton
      variant={getButtonVariant(uiSchema['ui:variant'])}
      onClick={() => {
        onFocus(name, '$$clicked');
      }}
      fullWidth={uiSchema['ui:fullWidth']}
      disabled={disabled || uiSchema['ui:disabled']}
      color={getButtonColor(uiSchema['ui:color'])}
    >
      {schema.title}
    </SpringButton>
  );
}
