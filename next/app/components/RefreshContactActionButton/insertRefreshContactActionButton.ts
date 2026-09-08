import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components';

export function insertRefreshContactActionButton(
  buttons: ActionMenuListButtonProps[],
  refreshContactButton: ActionMenuListButtonProps | null,
  beforeActionType?: string,
): ActionMenuListButtonProps[] {
  if (!refreshContactButton) {
    return buttons;
  }
  const insertionIndex = buttons.findIndex(
    ({ actionType }) => actionType === beforeActionType,
  );
  if (insertionIndex < 0) {
    return [...buttons, refreshContactButton];
  }
  return [
    ...buttons.slice(0, insertionIndex),
    refreshContactButton,
    ...buttons.slice(insertionIndex),
  ];
}
