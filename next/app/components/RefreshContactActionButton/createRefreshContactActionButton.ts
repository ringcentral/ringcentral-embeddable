import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components';
import { RefreshContactMd } from '@ringcentral/spring-icon';

interface CreateRefreshContactActionButtonOptions {
  disabled?: boolean;
  label: string;
  onRefreshContact?: (phoneNumber: string) => Promise<void> | void;
  phoneNumber?: string;
}

export function createRefreshContactActionButton({
  disabled,
  label,
  onRefreshContact,
  phoneNumber,
}: CreateRefreshContactActionButtonOptions): ActionMenuListButtonProps | null {
  if (!phoneNumber || !onRefreshContact) {
    return null;
  }
  return {
    actionType: 'refreshContact',
    color: 'secondary',
    disabled,
    label,
    onClick: (event) => {
      void onRefreshContact(phoneNumber);
      event.stopPropagation();
    },
    shape: 'squircle',
    size: 'medium',
    symbol: RefreshContactMd,
    variant: 'outlined',
  };
}
