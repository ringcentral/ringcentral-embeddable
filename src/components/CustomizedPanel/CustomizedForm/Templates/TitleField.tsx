import React from 'react';
import {
  RcBox as Box,
  RcDivider as Divider,
  RcTypography as Typography,
} from '@ringcentral/juno';

import { FormContextType, TitleFieldProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

export default function TitleField<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  title,
}: TitleFieldProps<T, S, F>) {
  return (
    <Box id={id} mb={1} mt={1}>
      <Typography variant="title1">{title}</Typography>
      <Divider />
    </Box>
  );
}
