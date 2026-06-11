import { RegistryFieldsType } from '@rjsf/utils';

import { Alert } from './Alert';
import { Button } from './Button';
import { Image } from './Image';
import { Link } from './Link';
import { List } from './List';
import { Search } from './Search';
import { Typography } from './Typography';

export const fields: RegistryFieldsType = {
  admonition: Alert,
  button: Button,
  image: Image,
  link: Link,
  list: List,
  search: Search,
  typography: Typography,
};
