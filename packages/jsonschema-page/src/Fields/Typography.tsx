import React from 'react';

import {
  RcTypography,
} from '@ringcentral/juno';
import { TextWithMarkdown } from '../components/TextWithMarkdown';

export function Typography({
  schema,
  uiSchema,
}) {
  const variant = uiSchema && uiSchema['ui:variant'] || 'body1';
  const isBulletedList = uiSchema && uiSchema['ui:bulletedList'];
  const component = isBulletedList ? 'li' : 'div';
  const style = isBulletedList ? {} : { marginTop: '5px' };
  return (
    <RcTypography
      variant={variant}
      style={style}
      component={component}
      color="neutral.f06"
    >
      <TextWithMarkdown text={schema.description} />
    </RcTypography>
  );
}
