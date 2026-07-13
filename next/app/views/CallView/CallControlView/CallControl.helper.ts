import type { ICallAction } from '@ringcentral-integration/micro-phone/src/app/hooks';

function insertBeforeHangUp(
  actions: ICallAction[],
  action: ICallAction,
): ICallAction[] {
  const hangUpIndex = actions.findIndex((item) => item.type === 'hangUp');
  if (hangUpIndex === -1) {
    return [...actions, action];
  }
  return [
    ...actions.slice(0, hangUpIndex),
    action,
    ...actions.slice(hangUpIndex),
  ];
}

export function addEmbeddableCallActions(
  actions: ICallAction[],
  options: {
    parkDisabled: boolean;
    voicemailDropDisabled?: boolean;
  },
): ICallAction[] {
  let result = actions;
  if (!result.some((action) => action.type === 'park')) {
    result = insertBeforeHangUp(result, {
      type: 'park',
      disabled: options.parkDisabled,
    });
  }
  if (
    typeof options.voicemailDropDisabled === 'boolean' &&
    !result.some((action) => action.type === 'voicemail')
  ) {
    result = insertBeforeHangUp(result, {
      type: 'voicemail',
      disabled: options.voicemailDropDisabled,
    });
  }
  return result;
}
