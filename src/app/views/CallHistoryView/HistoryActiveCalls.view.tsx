import type { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import { isInbound } from '@ringcentral-integration/commons/lib/callLogHelpers';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  type ICallAction,
  useCallActionButtons,
  useContactRenderInfoFromCall,
} from '@ringcentral-integration/micro-phone/src/app/hooks';
import type { CreateActionsHandler } from '@ringcentral-integration/micro-phone/src/app/services';
import { ActiveCallsView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ActiveCallsViewSpring';
import { CallControlView } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import { ActionMenuList } from '@ringcentral-integration/next-widgets/components';
import {
  injectable,
  RcViewModule,
  useConnector,
  useContainer,
} from '@ringcentral-integration/next-core';
import { List, ListItem, ListItemText } from '@ringcentral/spring-ui';
import type { FunctionComponent } from 'react';
import React from 'react';

import { useCallDisplayNameWithMatches } from '../../components/MatchedContactsTag';
import type { MatchedContactSelection } from '../../services/MatchedContactSelection';
import { getLoggedContact } from '../../services/MatchedContactSelection/getLoggedContact';

import i18n from './i18n';

type ActiveCallItemProps = {
  call: Call;
  divider: boolean;
  useActionsHandler: CreateActionsHandler;
  useActiveCallItemActions: (call: Call) => ICallAction[];
};

const ActiveCallItem: FunctionComponent<ActiveCallItemProps> = ({
  call,
  divider,
  useActionsHandler,
  useActiveCallItemActions,
}) => {
  const actions = useActiveCallItemActions(call);
  const onAction = useActionsHandler(call.telephonySessionId!);
  const buttons = useCallActionButtons(actions, onAction, {
    isConferenceCall: Boolean(call.isConferenceCall),
  });
  const matches = isInbound(call) ? call.fromMatches : call.toMatches;
  const matchedContactSelection = useContainer<MatchedContactSelection>(
    'MatchedContactSelection',
  );
  const selectedCallInfo = useConnector(() =>
    matchedContactSelection.resolveSelection('call', call.sessionId, matches),
  );
  const loggedContact = getLoggedContact(call.activityMatches, matches);
  const callSelectionInfo = loggedContact
    ? { displayedSelection: loggedContact, selections: matches ?? [] }
    : selectedCallInfo;
  const callWithSelection = { ...call, callSelectionInfo };
  const {
    Avatar,
    CallStatus,
    DisplayName: BaseDisplayName,
    OnOtherDevice,
    duration,
  } = useContactRenderInfoFromCall(callWithSelection, {
    phoneNumberDisplayMode: 'phoneNumber',
  });
  const DisplayName = useCallDisplayNameWithMatches(
    BaseDisplayName,
    call.sessionId,
    call.isConferenceCall ? undefined : matches,
    call.activityMatches,
  );
  return (
    <ListItem
      className="group"
      classes={{ content: 'bg-inherit' }}
      divider={divider}
      size="large"
      onClick={() => void onAction('activeCall', call.telephonySessionId)}
    >
      <Avatar size="large" />
      <ListItemText
        data-sign="displayName"
        primary={
          <div className="flex min-w-0 items-center gap-1">
            <DisplayName
              displayControl={{
                maybe: true,
                matchCounts: true,
              }}
            />
            {OnOtherDevice ? <OnOtherDevice mode="icon" /> : null}
          </div>
        }
        secondary={<CallStatus>({duration})</CallStatus>}
      />
      <ActionMenuList
        buttons={buttons}
        showIconAtMenuList={false}
        moreButtonProps={{ size: 'medium' }}
        propsMap={{
          all: {
            size: 'medium',
            iconSize: 'small',
          },
        }}
      />
    </ListItem>
  );
};

@injectable({
  name: 'HistoryActiveCallsView',
})
export class HistoryActiveCallsView extends RcViewModule {
  constructor(
    private _activeCallsView: ActiveCallsView,
    private _callControlView: CallControlView,
  ) {
    super();
  }

  get hasCalls(): boolean {
    return this._activeCallsView.getUIProps({}).calls.length > 0;
  }

  private useActiveCallItemActions = (call: Call): ICallAction[] => {
    const listActions = this._activeCallsView.useActiveCallItemActions(call);
    const isOtherDeviceCall = Boolean(!call.webphoneSession && call.id);
    if (!isOtherDeviceCall) {
      return listActions;
    }
    return this._callControlView.useCallActions({
      call,
      actionsDisabled: Boolean(listActions[0]?.disabled),
    });
  };

  override component(): React.ReactElement | null {
    const { calls } = useConnector(() => this._activeCallsView.getUIProps({}));
    const { useActionsHandler } = this._activeCallsView.getUIFunctions({});
    const { t } = useLocale(i18n);
    if (calls.length === 0) {
      return null;
    }
    return (
      <div
        className="max-h-64 flex-none overflow-y-auto border-b border-neutral-l01"
        data-sign="activeCallsList"
      >
        <div className="px-4 py-2 typography-subtitleMiniSemiBold text-neutral-b2">
          {t('activeCalls')}
        </div>
        <List>
          {calls.map((call, index) => (
            <ActiveCallItem
              key={call.telephonySessionId}
              call={call}
              divider={index < calls.length - 1}
              useActionsHandler={useActionsHandler}
              useActiveCallItemActions={this.useActiveCallItemActions}
            />
          ))}
        </List>
      </div>
    );
  }
}
