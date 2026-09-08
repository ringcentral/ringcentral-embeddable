import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components/ActionMenuList';
import {
  HistoryAction,
  HistoryActionType,
  useHistoryActionButtons,
} from '@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons';
import {
  AppsMd,
  ArrowRightUpMd,
  CalendarMd,
  CallListMd,
  CallMd,
  ContactsMd,
  DispositionMd,
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
  ViewMd,
} from '@ringcentral/spring-icon';

import type { ThirdPartyButton } from '../../services/ThirdParty/ThirdParty.interface';

type ActionSymbol = NonNullable<ActionMenuListButtonProps['symbol']>;

const CUSTOM_CALL_ACTION_ICONS: Record<string, ActionSymbol> = {
  addMember: InviteMd,
  aiNotes: SmartNotesMd,
  apps: AppsMd,
  calendar: CalendarMd,
  clock: CallListMd,
  download: DownloadMd,
  edit: EditMd,
  newAction: PlusMd,
  people: ContactsMd,
  phone: CallMd,
  read: MarkReadMd,
  refresh: RefreshMd,
  settings: SettingsMd,
  sms: Smsmd,
  unread: MarkUnreadMd,
  view: ViewMd,
  viewLog: ArrowRightUpMd,
};

interface UseCallHistoryActionButtonsOptions {
  actions: HistoryAction[];
  additionalActions: ThirdPartyButton[];
  call: unknown;
  onAction: (actionType: HistoryActionType) => Promise<void> | void;
  onAdditionalAction: (
    buttonId: string,
    resource: unknown,
  ) => Promise<void> | void;
}

function createLogButton(
  action: HistoryAction,
  onAction: (actionType: HistoryActionType) => Promise<void> | void,
  editing = false,
): ActionMenuListButtonProps {
  return {
    actionType: action.type,
    color: 'secondary',
    disabled: action.disabled,
    label: action.label,
    onClick: (event) => {
      void onAction(action.type);
      event.stopPropagation();
    },
    shape: 'squircle',
    size: 'medium',
    symbol:
      action.type === 'viewLog'
        ? ArrowRightUpMd
        : editing
        ? EditMd
        : DispositionMd,
    variant: 'outlined',
  };
}

function createAdditionalActionButton(
  action: ThirdPartyButton,
  call: unknown,
  onAdditionalAction: UseCallHistoryActionButtonsOptions['onAdditionalAction'],
): ActionMenuListButtonProps {
  return {
    actionType: action.id,
    color: 'secondary',
    label: action.label || action.id,
    onClick: (event) => {
      void onAdditionalAction(action.id, call);
      event.stopPropagation();
    },
    shape: 'squircle',
    size: 'medium',
    symbol: CUSTOM_CALL_ACTION_ICONS[action.icon || ''] || AppsMd,
    variant: 'outlined',
  };
}

export function useCallHistoryActionButtons({
  actions,
  additionalActions,
  call,
  onAction,
  onAdditionalAction,
}: UseCallHistoryActionButtonsOptions): ActionMenuListButtonProps[] {
  const standardActions = actions.filter(
    ({ type }) => type !== 'createLog' && type !== 'viewLog',
  );
  const standardButtons = useHistoryActionButtons(standardActions, onAction);
  const createOrEditAction = actions.find(({ type }) => type === 'createLog');
  const viewLogAction = actions.find(({ type }) => type === 'viewLog');
  return [
    ...(createOrEditAction
      ? [createLogButton(createOrEditAction, onAction, Boolean(viewLogAction))]
      : []),
    ...standardButtons,
    ...(viewLogAction ? [createLogButton(viewLogAction, onAction)] : []),
    ...additionalActions.map((action) =>
      createAdditionalActionButton(action, call, onAdditionalAction),
    ),
  ];
}
