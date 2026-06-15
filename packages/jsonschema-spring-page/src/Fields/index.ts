import { RegistryFieldsType } from '@rjsf/utils';

import { Alert } from './Alert';
import BooleanField from './BooleanField';
import { Button } from './Button';
import { Image } from './Image';
import { Link } from './Link';
import { List } from './List';
import { Search } from './Search';
import { Typography } from './Typography';

export const fields: RegistryFieldsType = {
  admonition: Alert,
  BooleanField,
  button: Button,
  image: Image,
  link: Link,
  list: List,
  search: Search,
  typography: Typography,
};
