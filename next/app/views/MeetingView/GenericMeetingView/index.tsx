import React, { useRef } from 'react';
import {
  injectable,
  optional,
  RouterPlugin,
  UIFunctions,
  useConnector,
} from '@ringcentral-integration/next-core';
import { GenericMeetingViewSpring } from '@ringcentral-integration/micro-meeting/src/app/views';
import type {
  GenericMeetingPanelSpringFunctions,
  GenericMeetingViewSpringOptions,
} from '@ringcentral-integration/micro-meeting/src/app/views/GenericMeetingViewSpring';
import { Brand, Locale } from '@ringcentral-integration/micro-core/src/app/services';
import { GenericMeeting } from '@ringcentral-integration/micro-meeting/src/app/services/GenericMeeting';
import type { RcVMeetingModel } from '@ringcentral-integration/commons/interfaces/Rcv.model';
import { GenericMeetingPanelSpring } from './components/GenericMeetingPanelSpring';
import { formatMeetingInfo } from '../../../../lib/formatMeetingInfo';
import { MeetingInviteView } from '../MeetingInviteView';

@injectable({
  name: 'GenericMeetingView',
})
export class GenericMeetingView extends GenericMeetingViewSpring {
  constructor(
    protected _genericMeeting: GenericMeeting,
    protected _router: RouterPlugin,
    protected _brand: Brand,
    protected _locale: Locale,
    private _meetingInviteView: MeetingInviteView,
    @optional('GenericMeetingViewSpringOptions')
    private _meetingViewOptions?: GenericMeetingViewSpringOptions,
  ) {
    super(_genericMeeting, _router, _brand, _meetingViewOptions);
  }

  getUIFunctions(): UIFunctions<GenericMeetingPanelSpringFunctions> {
    return {
      ...super.getUIFunctions(),
      onScheduleMeeting: async (): Promise<void> => {
        try {
          const result = await this._genericMeeting.schedule(
            this.meeting as RcVMeetingModel,
          );
          const formattedMeetingInfo = formatMeetingInfo(
            result, this._brand, this._locale.currentLocale, this._genericMeeting.isRCV
          );
          this._meetingInviteView.showModal(formattedMeetingInfo);
        } catch (error) {
          console.error('Failed to schedule meeting:', error);
        }
      },
      onBackClick: () => {
        this._router.goBack();
      },
    };
  }

  component(props: any) {
    const navigationState = props.location!.search!;

    const { current: uiFunctions } = useRef(this.getUIFunctions());
    const _props = useConnector(() => {
      return {
        ...this.getUIProps(),
        navigationState,
      };
    });

    const Component =
      this._meetingViewOptions?.component || GenericMeetingPanelSpring;
    return <Component {..._props} {...uiFunctions} />;
  }
}