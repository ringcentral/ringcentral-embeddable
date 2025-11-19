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
  const { id, description, style = {} } = props;
  if (description) {
    return (
      <StyledTypography id={id} variant="caption1" color="neutral.f05" component="div" style={style}>
        {
          typeof description === 'string' ? <TextWithMarkdown text={description} /> : description
        }
      </StyledTypography>
    );
  }

  return null;
}