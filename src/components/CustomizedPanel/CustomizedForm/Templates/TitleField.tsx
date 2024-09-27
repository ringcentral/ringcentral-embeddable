import React from 'react';
import {
  RcBox as Box,
  RcTypography as Typography,
  RcIcon,
  RcDivider as Divider,
  styled,
  css,
} from '@ringcentral/juno';
import { ArrowDown2, ArrowUp2 } from '@ringcentral/juno-icon';

import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

const StyledTitle = styled(Typography)`
  flex: 1;
`;

const StyledBox = styled(Box)<{ $clickable: boolean }>`
  display: flex;
  align-items: center;
  flex-direction: row;
  ${({ $clickable }) => $clickable && css`
    cursor: pointer;
  `};
`;

const StyledIcon = styled(RcIcon)`
  margin: 4px 0;
`;

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema = {},
  extended = false,
  onClick = undefined
}: TitleFieldProps<T, S, F>) {
  const collapsible = uiSchema['ui:collapsible'] || false;
  return (
    <StyledBox
      id={id} mb={1} mt={1}
      $clickable={collapsible}
      onClick={onClick}
    >
      <StyledTitle variant="subheading1">{title}</StyledTitle>
      {
        collapsible ? (
          <StyledIcon
            symbol={extended ? ArrowUp2 : ArrowDown2}
          />
        ) : null
      }
      {
        collapsible ? null : (<Divider />)
      }
    </StyledBox>
  );
}
