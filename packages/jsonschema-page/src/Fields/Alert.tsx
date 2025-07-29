import React from 'react';

import {
  RcAlert,
  styled,
} from '@ringcentral/juno';
import { TextWithMarkdown } from '../lib/TextWithMarkdown';

const StyledAlert = styled(RcAlert)`
  &.RcAlert-root {
    padding: 10px;
  }

  .RcAlert-message {
    font-size: 0.875rem;
  }
`;

export function Alert({
  schema,
  uiSchema,
}) {
  return (
    <StyledAlert severity={uiSchema && uiSchema['ui:severity'] || 'info'}>
      <TextWithMarkdown text={schema.description} />
    </StyledAlert>
  );
}
