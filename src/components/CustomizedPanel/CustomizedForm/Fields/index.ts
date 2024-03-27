import { RegistryFieldsType } from '@rjsf/utils';

import { Alert } from './Alert';
import { Typography } from './Typography';
import { Button } from './Button';

export const fields: RegistryFieldsType = {
  admonition: Alert,
  typography: Typography,
  button: Button,
};
