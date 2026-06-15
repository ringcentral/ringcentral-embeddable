import React from 'react';
import { Divider, Icon, Text } from '@ringcentral/spring-ui';
import { CaretDownMd, CaretUpMd } from '@ringcentral/spring-icon';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  TitleFieldProps,
} from '@rjsf/utils';

type ExtraTitleFieldProps = {
  extended?: boolean;
  onClick?: () => void;
};

export default function TitleField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  title,
  uiSchema = {},
  extended = false,
  onClick,
}: TitleFieldProps<T, S, F> & ExtraTitleFieldProps) {
  const isCollapsible = uiSchema['ui:collapsible'] || false;
  const isDisabled = uiSchema['ui:disabled'] || false;
  return (
    <>
      <div
        id={id}
        style={{
          alignItems: 'center',
          cursor: isCollapsible ? 'pointer' : 'default',
          display: 'flex',
          margin: '8px 0',
          overflow: 'hidden',
        }}
        onClick={onClick}
      >
        <Text
          className={extended ? 'typography-subtitle' : 'typography-mainText'}
          component="div"
          style={{
            color: isDisabled ? 'var(--sui-colors-neutral-b3)' : undefined,
            flex: 1,
          }}
        >
          {title}
        </Text>
        {isCollapsible ? <Icon symbol={extended ? CaretUpMd : CaretDownMd} size="small" /> : null}
      </div>
      {isCollapsible ? <Divider /> : null}
    </>
  );
}
