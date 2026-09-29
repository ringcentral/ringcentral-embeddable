import type { ICallAction } from '@ringcentral-integration/micro-phone/src/app/hooks';

/**
 * the call control grid keeps at most three rows of three buttons; the
 * remaining actions move into the "more" menu next to the end button
 */
export const MAX_VISIBLE_CALL_ACTIONS = 9;

/**
 * the audio action renders the audio card as its popup, which cannot live
 * inside a menu item, so it is never moved into the "more" menu
 */
const PINNED_CALL_ACTION_TYPES = ['audio'];

const OTHER_DEVICE_CALL_ACTION_TYPES = new Set([
  'mute',
  'unmute',
  'hold',
  'unHold',
  'merge',
  'transfer',
  'record',
  'stopRecord',
  'hangUp',
]);

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
    flipDisabled?: boolean;
    isOtherDeviceCall?: boolean;
    switchDisabled?: boolean;
    /**
     * While a pre-recorded voicemail plays, every in-call action except ending
     * the call is disabled — the same set legacy's ActiveCallPad greyed out.
     */
    droppingVoicemail?: boolean;
  },
): ICallAction[] {
  let result = options.isOtherDeviceCall
    ? actions.filter((action) => OTHER_DEVICE_CALL_ACTION_TYPES.has(action.type))
    : actions;
  // each insertion goes right before hangUp, so the call order below is also
  // the rendered order: voicemail drop, park, flip, switch
  if (
    !options.isOtherDeviceCall &&
    typeof options.voicemailDropDisabled === 'boolean' &&
    !result.some((action) => action.type === 'voicemail')
  ) {
    result = insertBeforeHangUp(result, {
      type: 'voicemail',
      disabled: options.voicemailDropDisabled,
    });
  }
  if (
    !options.isOtherDeviceCall &&
    !result.some((action) => action.type === 'park')
  ) {
    result = insertBeforeHangUp(result, {
      type: 'park',
      disabled: options.parkDisabled,
    });
  }
  if (
    !options.isOtherDeviceCall &&
    typeof options.flipDisabled === 'boolean' &&
    !result.some((action) => action.type === 'flip')
  ) {
    result = insertBeforeHangUp(result, {
      type: 'flip',
      disabled: options.flipDisabled,
    });
  }
  if (
    typeof options.switchDisabled === 'boolean' &&
    !result.some((action) => action.type === 'switch')
  ) {
    result = insertBeforeHangUp(result, {
      type: 'switch',
      disabled: options.switchDisabled,
    });
  }
  if (options.droppingVoicemail) {
    result = result.map((action) =>
      action.type === 'hangUp' ? action : { ...action, disabled: true },
    );
  }
  return result;
}

/**
 * splits the call actions rendered in the grid (the end call action is not part
 * of them) into the visible buttons and the ones shown in the "more" menu
 */
export function splitCallActions<T extends { actionType: string }>(
  actions: T[],
  maxVisible: number = MAX_VISIBLE_CALL_ACTIONS,
): { visible: T[]; overflow: T[] } {
  const overflowCount = Math.max(actions.length - maxVisible, 0);
  if (overflowCount === 0) {
    return { visible: actions, overflow: [] };
  }
  const visible: T[] = [];
  const overflow: T[] = [];
  // fill the overflow from the tail, keeping the pinned actions visible
  for (let index = actions.length - 1; index >= 0; index -= 1) {
    const action = actions[index]!;
    if (
      overflow.length < overflowCount &&
      !PINNED_CALL_ACTION_TYPES.includes(action.actionType)
    ) {
      overflow.unshift(action);
    } else {
      visible.unshift(action);
    }
  }
  if (process.env.NODE_ENV !== 'production' && overflow.length < overflowCount) {
    throw new Error(
      'The call control actions cannot fit into the grid: too many pinned actions',
    );
  }
  return { visible, overflow };
}
