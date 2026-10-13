import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components/ActionMenuList';
import {
  HistoryAction,
  HistoryActionType,
  useHistoryActionButtons,
} from '@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons';
import {
  ArrowRightUpMd,
  DispositionMd,
  EditMd,
} from '@ringcentral/spring-icon';

import { createThirdPartyActionButton } from '../../components/ThirdPartyActionButton';
import type { ThirdPartyButton } from '../../services/ThirdParty/ThirdParty.interface';

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
      createThirdPartyActionButton({
        action,
        onClick: onAdditionalAction,
        resource: call,
      }),
    ),
  ];
}
