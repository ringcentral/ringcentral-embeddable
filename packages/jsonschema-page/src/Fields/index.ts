import { RegistryFieldsType } from '@rjsf/utils';

import { Alert } from './Alert';
import { Typography } from './Typography';
import { Button } from './Button';
import { List } from './List';
import { Link } from './Link';
import { Search } from './Search';
import { Image } from './Image';

export const fields: RegistryFieldsType = {
  admonition: Alert,
  typography: Typography,
  button: Button,
  list: List,
  link: Link,
  search: Search,
  image: Image,
};
