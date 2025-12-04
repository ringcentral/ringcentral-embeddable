import React from 'react';
import {
  RcBox as Box,
  RcTypography as Typography,
  RcIcon,
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
  overflow: hidden;
  ${({ $clickable }) => $clickable && css`
    cursor: pointer;
  `};
`;

const StyledIcon = styled(RcIcon)`
  margin: 0;
`;

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
  uiSchema = {},
  extended = false,
  onClick = undefined
}: TitleFieldProps<T, S, F>) {
  const collapsible = uiSchema['ui:collapsible'] || false;
  const disabled = uiSchema['ui:disabled'] || false;
  const color = disabled ? 'disabled.f01' : 'neutral.f06';
  return (
    <StyledBox
      id={id} mb={1} mt={1}
      $clickable={collapsible}
      onClick={onClick}
    >
      <StyledTitle variant={extended ? 'body2' : 'body1'} color={color} component="div">{title}</StyledTitle>
      {
        collapsible ? (
          <StyledIcon
            symbol={extended ? ArrowUp2 : ArrowDown2}
            color="neutral.f06"
          />
        ) : null
      }
    </StyledBox>
  );
}
