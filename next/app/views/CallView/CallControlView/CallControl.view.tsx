import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import type { NormalizedSession } from '@ringcentral-integration/commons/interfaces/Webphone.interface';
import { AppFeatures } from '@ringcentral-integration/micro-auth/src/app/services';
import { SyncTabView } from '@ringcentral-integration/micro-core/src/app/views';
import type { UIFunctions } from '@ringcentral-integration/next-core';
import {
  delegate,
  inject,
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
  Webphone as MicroPhoneWebphone,
} from '@ringcentral-integration/micro-phone/src/app/services';
import type { CallActionRoutePath } from '@ringcentral-integration/micro-phone/src/app/services/CallAction/CallAction.interface';
import { AudioCardView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/AudioCardViewSpring';
import { CallControlView as CallControlViewBase } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import type {
  CallControlViewOptions,
  CallControlViewPanelProps,
  CallControlViewProps,
} from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControl.view.interface';

import { VoicemailDrop } from '../../../services/VoicemailDrop';
import type { Webphone } from '../../../services/WebphoneV2';
import { VoicemailDropView } from '../../VoicemailDropView';

import { addEmbeddableCallActions } from './CallControl.helper';
import { VoicemailDropCallControlPanel } from './VoicemailDropCallControlPanel';

const PARK_PATH = 'park' as unknown as CallActionRoutePath;

type VoicemailDropSession = NormalizedSession & {
  voicemailDropStatus?: string;
};

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
    voicemailDrop: VoicemailDrop,
    @inject(MicroPhoneWebphone) webphone: Webphone,
    voicemailDropView: VoicemailDropView,
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
      {
        ...callControlViewOptions,
        component:
          callControlViewOptions?.component ??
          (VoicemailDropCallControlPanel as unknown as CallControlViewOptions['component']),
      },
    );
    this._parkCallAction = callAction;
    this._parkCallingSettings = callingSettings;
    this._parkActiveCallControl = activeCallControl;
    this._voicemailDrop = voicemailDrop;
    this._webphone = webphone;
    this._voicemailDropView = voicemailDropView;
  }

  private readonly _parkCallAction: CallAction;
  private readonly _parkCallingSettings: CallingSettings;
  private readonly _parkActiveCallControl: ActiveCallControl;
  private readonly _voicemailDrop: VoicemailDrop;
  private readonly _webphone: Webphone;
  private readonly _voicemailDropView: VoicemailDropView;

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
    const {
      session,
      isWebphoneMode,
      webphoneSession,
      hasVoicemailDropPermission,
    } = useConnector(() => ({
      session: this._parkActiveCallControl.getActiveSession(telephonySessionId),
      isWebphoneMode: this._parkCallingSettings.isWebphoneMode,
      webphoneSession: this._webphone.sessions.find(
        (item) => item.partyData?.sessionId === telephonySessionId,
      ) as VoicemailDropSession | undefined,
      hasVoicemailDropPermission:
        this._voicemailDrop.hasVoicemailDropPermission,
    }));
    const isOnHold = session?.isOnHold ?? false;
    const transferring = Boolean(props.call.warmTransferInfo);
    const parkDisabled =
      !isWebphoneMode || transferring || isOnHold || props.actionsDisabled;
    const showVoicemailDrop =
      hasVoicemailDropPermission &&
      isWebphoneMode &&
      webphoneSession?.direction === callDirections.outbound &&
      !props.call.isConferenceCall;
    const voicemailDropDisabled = showVoicemailDrop
      ? transferring ||
        isOnHold ||
        props.actionsDisabled ||
        Boolean(webphoneSession.voicemailDropStatus)
      : undefined;
    return addEmbeddableCallActions(baseActions, {
      parkDisabled,
      voicemailDropDisabled,
    });
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
      if (actionType === 'voicemail') {
        const sessionId = this._webphone.sessions.find(
          (session) => session.partyData?.sessionId === telephonySessionId,
        )?.id;
        if (sessionId) {
          this._voicemailDropView.open(sessionId);
        }
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
