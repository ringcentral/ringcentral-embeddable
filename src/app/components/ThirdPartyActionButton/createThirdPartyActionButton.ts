import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components/ActionMenuList';
import {
  AppsMd,
  ArrowRightUpMd,
  CalendarMd,
  CallListMd,
  CallMd,
  ContactsMd,
  DownloadMd,
  EditMd,
  InviteMd,
  MarkReadMd,
  MarkUnreadMd,
  PlusMd,
  RefreshMd,
  SettingsMd,
  SmartNotesMd,
  Smsmd,
  TrashMd,
  ViewMd,
} from '@ringcentral/spring-icon';

import type { ThirdPartyButton } from '../../services/ThirdParty/ThirdParty.interface';

type ActionSymbol = NonNullable<ActionMenuListButtonProps['symbol']>;

/**
 * The icon names hosts could use for `callAction` and `messageAction`
 * buttons in 3.x.
 */
const THIRD_PARTY_ACTION_ICONS: Record<string, ActionSymbol> = {
  addMember: InviteMd,
  aiNotes: SmartNotesMd,
  apps: AppsMd,
  calendar: CalendarMd,
  clock: CallListMd,
  createContact: InviteMd,
  delete: TrashMd,
  download: DownloadMd,
  edit: EditMd,
  newAction: PlusMd,
  people: ContactsMd,
  phone: CallMd,
  read: MarkReadMd,
  refresh: RefreshMd,
  refreshContact: RefreshMd,
  settings: SettingsMd,
  sms: Smsmd,
  unread: MarkUnreadMd,
  view: ViewMd,
  viewContact: ContactsMd,
  viewLog: ArrowRightUpMd,
};

interface CreateThirdPartyActionButtonOptions {
  action: ThirdPartyButton;
  disabled?: boolean;
  onClick: (buttonId: string, resource: unknown) => Promise<void> | void;
  /** Sent to the host's `buttonEventPath` with the click. */
  resource: unknown;
}

/**
 * Builds an action menu button for a button the third-party service
 * registered, such as a `callAction` or `messageAction`.
 */
export function createThirdPartyActionButton({
  action,
  disabled,
  onClick,
  resource,
}: CreateThirdPartyActionButtonOptions): ActionMenuListButtonProps {
  return {
    actionType: action.id,
    color: 'secondary',
    disabled,
    label: action.label || action.id,
    onClick: (event) => {
      void onClick(action.id, resource);
      event.stopPropagation();
    },
    shape: 'squircle',
    size: 'medium',
    symbol: THIRD_PARTY_ACTION_ICONS[action.icon || ''] || AppsMd,
    variant: 'outlined',
  };
}
