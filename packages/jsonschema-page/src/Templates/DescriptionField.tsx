import React from 'react';
import { RcTypography, styled } from '@ringcentral/juno';
import { DescriptionFieldProps, FormContextType, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { TextWithMarkdown } from '../components/TextWithMarkdown';

const StyledTypography = styled(RcTypography)`
  a {
    font-size: inherit;
    line-height: inherit;
  }
`;

export default function DescriptionField<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: DescriptionFieldProps<T, S, F>) {
  const { id, description, style = {}, uiSchema = {} } = props;
  if (description) {
    const disabled = uiSchema['ui:disabled'] || false;
    const color = disabled ? 'disabled.f02' : 'neutral.f05';
    return (
      <StyledTypography id={id} variant="caption1" color={color} component="div" style={style}>
        {
          typeof description === 'string' ? <TextWithMarkdown text={description} /> : description
        }
      </StyledTypography>
    );
  }

  return null;
}