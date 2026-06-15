import React from 'react';
import { Text } from '@ringcentral/spring-ui';
import type { FieldProps } from '@rjsf/utils';
import { TextWithMarkdown } from '../components/TextWithMarkdown';
import { getTypographyClassName, getTypographyComponent } from '../utils/compat';

function getStringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function joinClassNames(...classNames: Array<string | false | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

export function Typography({ schema, uiSchema = {} }: FieldProps) {
  const isBulletedList = Boolean(uiSchema['ui:bulletedList']);
  const variant = getStringValue(uiSchema['ui:variant']);
  const className = joinClassNames(
    'm-0 text-neutral-b1 [overflow-wrap:anywhere]',
    getTypographyClassName(variant),
    isBulletedList ? 'list-disc list-outside !overflow-visible' : 'mt-[5px]',
  );

  return (
    <Text
      component={getTypographyComponent(variant, isBulletedList)}
      className={className}
    >
      <TextWithMarkdown text={schema.description} />
    </Text>
  );
}
