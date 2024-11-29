import React from 'react';
import type { FunctionComponent } from 'react';
import { RcButton } from '@ringcentral/juno';
import i18n from '@ringcentral-integration/widgets/components/SaveButton/i18n';

type SaveButtonProps = {
  fullWidth?: boolean;
  currentLocale: string;
  disabled?: boolean;
  onClick?: (...args: any[]) => any;
  loading?: boolean;
  className?: string;
  color?: string;
};

export const SaveButton: FunctionComponent<SaveButtonProps> = ({
  currentLocale,
  disabled = false,
  onClick = undefined,
  fullWidth = true,
  loading = false,
  className = undefined,
  color = 'action.primary',
}) => {
  return (
    <RcButton
      className={className}
      data-sign="saveButton"
      disabled={disabled}
      onClick={onClick}
      fullWidth={fullWidth}
      loading={loading}
      variant="contained"
      radius="round"
      color={color}
    >
      {i18n.getString('save', currentLocale)}
    </RcButton>
  );
};
