import React from 'react';
import { Alert as SpringAlert } from '@ringcentral/spring-ui';
import { TextWithMarkdown } from '../components/TextWithMarkdown';

export function Alert({ schema, uiSchema = {} }: any) {
  return (
    <SpringAlert severity={uiSchema['ui:severity'] || 'info'} style={{ padding: 10 }}>
      <TextWithMarkdown text={schema.description} />
    </SpringAlert>
  );
}
