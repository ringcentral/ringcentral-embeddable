import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import {
  NumberFormatter,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { ComposeText } from '@ringcentral-integration/micro-message/src/app/services';
import {
  CallAction,
  type CallMetaInfo,
} from '@ringcentral-integration/micro-phone/src/app/services';
import type { UIFunctions, UIProps } from '@ringcentral-integration/next-core';
import {
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import React, { useRef } from 'react';
import { Webphone } from '@ringcentral-integration/micro-phone/src/app/services';
import { MonitoredExtensions } from '../../../services/MonitoredExtensions';

import type {
  ParkActionResult,
  ParkViewOptions,
  ParkViewPanelProps,
  ParkViewProps,
} from './Park.view.interface';
import { ParkPage } from './ParkPage';

const CONTROLS_PATH: CallMetaInfo['currentPath'] = 'controls';

@injectable({
  name: 'ParkView',
})
export class ParkView extends RcViewModule {
  constructor(
    private _webphone: Webphone,
    private _monitoredExtensions: MonitoredExtensions,
    private _callAction: CallAction,
    private _numberFormatter: NumberFormatter,
    private _router: RouterPlugin,
    @optional() private _composeText?: ComposeText,
    @optional('ParkViewOptions')
    private _parkViewOptions?: ParkViewOptions,
  ) {
    super();
  }

  getUIProps({
    call,
  }: ParkViewProps): UIProps<ParkViewPanelProps> {
    const sessionId = call.webphoneSession?.id;
    const session = sessionId
      ? this._webphone.sessions.find((s) => s.id === sessionId)
      : undefined;
    return {
      parkLocations: this._monitoredExtensions.parkLocations,
      session,
      sessionId,
    };
  }

  getUIFunctions({
    call,
  }: ParkViewProps): UIFunctions<ParkViewPanelProps> {
    const telephonySessionId = call.telephonySessionId!;
    const sessionId = call.webphoneSession?.id;
    return {
      onBack: () => {
        this._callAction.updateCallMetaInfo(telephonySessionId, {
          currentPath: CONTROLS_PATH,
        });
      },
      onCallEnd: () => {
        this._callAction.updateCallMetaInfo(telephonySessionId, {
          currentPath: CONTROLS_PATH,
        });
      },
      formatPhone: (phoneNumber: string) =>
        this._numberFormatter.formatNumber(phoneNumber),
      onPark: async (locationId?: string): Promise<ParkActionResult | null> => {
        if (!sessionId) {
          return null;
        }
        const session = this._webphone.sessions.find(
          (item) => item.id === sessionId,
        );
        if (!session) {
          return null;
        }
        const phoneNumber =
          session.direction === callDirections.inbound
            ? session.from
            : session.to;
        let destination: string | undefined;
        if (!locationId) {
          destination = await this._webphone.park(sessionId);
        } else {
          const parkLocation = this._monitoredExtensions.parkLocations.find(
            (item) => item.id === locationId,
          );
          if (!parkLocation) {
            return null;
          }
          destination = await this._webphone.parkToLocation(
            sessionId,
            parkLocation.extension,
          );
        }
        if (!destination) {
          return null;
        }
        return {
          fromNumber: phoneNumber ?? '',
          destination,
        };
      },
      onText: async (text?: string) => {
        if (!text || !this._composeText) {
          return;
        }
        await this._composeText.clean();
        await this._router.push('/composeText');
        await this._composeText.updateMessageText(text);
      },
    };
  }

  component(props: ParkViewProps) {
    const { current: uiFunctions } = useRef(this.getUIFunctions(props));
    const _props = useConnector(() => {
      const uiProps = this.getUIProps(props);
      return {
        ...props,
        ...uiProps,
      };
    });

    const Component = this._parkViewOptions?.component || ParkPage;

    return <Component {..._props} {...uiFunctions} />;
  }
}
