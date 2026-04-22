import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services';
import { SyncTabView } from '@ringcentral-integration/micro-core/src/app/views';
import type { UIFunctions } from '@ringcentral-integration/next-core';
import {
  delegate,
  injectable,
  optional,
  Root,
  useConnector,
} from '@ringcentral-integration/next-core';

import type { ICallAction } from '@ringcentral-integration/micro-phone/src/app/hooks';
import {
  ActiveCallControl,
  CallAction,
  CallingSettings,
  ForwardingNumber,
  type OnCallActionType,
} from '@ringcentral-integration/micro-phone/src/app/services';
import type { CallActionRoutePath } from '@ringcentral-integration/micro-phone/src/app/services/CallAction/CallAction.interface';
import { AudioCardView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/AudioCardViewSpring';
import { CallControlView as CallControlViewBase } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import type {
  CallControlViewOptions,
  CallControlViewPanelProps,
  CallControlViewProps,
} from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControl.view.interface';

const PARK_PATH = 'park' as unknown as CallActionRoutePath;

function insertParkAction(
  actions: ICallAction[],
  disabled: boolean,
): ICallAction[] {
  if (actions.some((action) => action.type === 'park')) {
    return actions;
  }
  const parkAction: ICallAction = {
    type: 'park',
    disabled,
  };
  const hangUpIndex = actions.findIndex((action) => action.type === 'hangUp');
  if (hangUpIndex === -1) {
    return [...actions, parkAction];
  }
  return [
    ...actions.slice(0, hangUpIndex),
    parkAction,
    ...actions.slice(hangUpIndex),
  ];
}

@injectable({
  name: 'CallControlView',
})
// @ts-expect-error override private base method useCallActions to inject the park action
export class CallControlView extends CallControlViewBase {
  constructor(
    callAction: CallAction,
    callingSettings: CallingSettings,
    activeCallControl: ActiveCallControl,
    forwardingNumber: ForwardingNumber,
    appFeatures: AppFeatures,
    root: Root,
    syncTabView: SyncTabView,
    audioCardView: AudioCardView,
    @optional('CallControlViewOptions')
    callControlViewOptions?: CallControlViewOptions,
  ) {
    super(
      callAction,
      callingSettings,
      activeCallControl,
      forwardingNumber,
      appFeatures,
      root,
      syncTabView,
      audioCardView,
      callControlViewOptions,
    );
    this._parkCallAction = callAction;
    this._parkCallingSettings = callingSettings;
    this._parkActiveCallControl = activeCallControl;
  }

  private readonly _parkCallAction: CallAction;
  private readonly _parkCallingSettings: CallingSettings;
  private readonly _parkActiveCallControl: ActiveCallControl;

  @delegate('server')
  async navigateToPark(telephonySessionId: string): Promise<void> {
    await this._parkCallAction.updateCallMetaInfo(telephonySessionId, {
      currentPath: PARK_PATH,
    });
  }

  private useCallActions(props: CallControlViewProps): ICallAction[] {
    const baseActions = (
      CallControlViewBase.prototype as unknown as {
        useCallActions: (p: CallControlViewProps) => ICallAction[];
      }
    ).useCallActions.call(this, props);
    const telephonySessionId = props.call.telephonySessionId!;
    const { session, isWebphoneMode } = useConnector(() => ({
      session:
        this._parkActiveCallControl.getActiveSession(telephonySessionId),
      isWebphoneMode: this._parkCallingSettings.isWebphoneMode,
    }));
    const isOnHold = session?.isOnHold ?? false;
    const transferring = Boolean(props.call.warmTransferInfo);
    const parkDisabled =
      !isWebphoneMode || transferring || isOnHold || props.actionsDisabled;
    return insertParkAction(baseActions, parkDisabled);
  }

  override getUIFunctions(
    props: CallControlViewProps,
  ): UIFunctions<CallControlViewPanelProps> {
    const baseFunctions = super.getUIFunctions(props);
    const telephonySessionId = props.call.telephonySessionId!;
    const onAction: OnCallActionType = async (actionType, ...args) => {
      if (actionType === 'park') {
        await this.navigateToPark(telephonySessionId);
        return;
      }
      await baseFunctions.onAction(actionType, ...args);
    };
    return {
      ...baseFunctions,
      onAction,
    };
  }
}
