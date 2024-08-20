import React from 'react';
import {
  RcBox as Box,
  RcList as List,
  RcListItem as ListItem,
  RcListItemIcon as ListItemIcon,
  RcListItemText as ListItemText,
  RcPaper as Paper,
  RcTypography as Typography,
  RcIcon,
} from '@ringcentral/juno';
import { InfoBorder as ErrorIcon } from '@ringcentral/juno-icon';

import { ErrorListProps, FormContextType, RJSFSchema, StrictRJSFSchema, TranslatableString } from '@rjsf/utils';

export default function ErrorList<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  errors,
  registry,
}: ErrorListProps<T, S, F>) {
  const { translateString } = registry;
  return (
    <Paper elevation={2}>
      <Box mb={2} p={2}>
        <Typography variant="caption2">{translateString(TranslatableString.ErrorsLabel)}</Typography>
        <List dense={true}>
          {errors.map((error, i: number) => {
            return (
              <ListItem key={i}>
                <ListItemIcon>
                  <RcIcon
                    symbol={ErrorIcon}
                    color="danger.b04"
                  />
                </ListItemIcon>
                <ListItemText primary={error.stack} />
              </ListItem>
            );
          })}
        </List>
      </Box>
    </Paper>
  );
}