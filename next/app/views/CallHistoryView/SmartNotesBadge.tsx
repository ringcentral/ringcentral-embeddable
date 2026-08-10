import { SmartNotesMd } from '@ringcentral/spring-icon';
import { Icon } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

interface SmartNotesBadgeProps {
  label: string;
  show: boolean;
}

export const SmartNotesBadge: FunctionComponent<SmartNotesBadgeProps> = ({
  label,
  show,
}) => {
  if (!show) {
    return null;
  }
  return (
    <Icon
      aria-label={label}
      className="text-extra-amethyst"
      data-sign="smartNotesBadge"
      size="small"
      symbol={SmartNotesMd}
      title={label}
    />
  );
};
