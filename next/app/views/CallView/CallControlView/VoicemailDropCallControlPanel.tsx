import { FormattedPhoneNumber } from '@ringcentral-integration/micro-auth/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { useCallActionButtons } from '@ringcentral-integration/micro-phone/src/app/hooks';
import type { CallControlViewPanelProps } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import { AiNoteTip } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/AiNoteTip';
import { CallCtrlButton } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/CallCtrlButton';
import { TransferringCall } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/TransferringCall';
import { useCallControlLayout } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring/CallControlPanel/useCallControlLayout';
import {
  CallButton,
  MenuItemText,
  MenuList,
  Option,
} from '@ringcentral/spring-ui';
import React, { type FC, useMemo } from 'react';

import voicemailDropI18n from '../../VoicemailDropView/i18n';

import { splitCallActions } from './CallControl.helper';
import {
  CallControlMoreButton,
  type CallControlMoreAction,
} from './CallControlMoreButton';

function useEmbeddableCallActionButtons(props: CallControlViewPanelProps) {
  const { actions, call, onAction } = props;
  const { t } = useLocale(voicemailDropI18n);
  const callActions = useCallActionButtons(actions, onAction, {
    isConferenceCall: Boolean(call.isConferenceCall),
  });

  return useMemo(
    () =>
      callActions.map((action) =>
        action.actionType === 'voicemail'
          ? {
              ...action,
              label: t('voicemailDrop'),
              color: 'secondary' as const,
              variant: 'outlined' as const,
            }
          : action,
      ),
    [callActions, t],
  );
}

export const VoicemailDropCallControlPanel: FC<CallControlViewPanelProps> = (
  props,
) => {
  const {
    flipNumbers,
    call,
    transferringCalls,
    onAction,
    AudioCardComponent: AudioCard,
  } = props;
  const callActions = useEmbeddableCallActionButtons(props);
  // the last action is the end call button, it is rendered in the footer
  const { visible: renderActions, overflow: overflowActions } = useMemo(
    () => splitCallActions(callActions.slice(0, -1)),
    [callActions],
  );

  const actionButtons = useMemo(
    () => (
      <div
        className="grid w-full grid-cols-3 gap-4 px-10"
        data-sign="actionButtons"
      >
        {renderActions.map(
          ({
            actionType,
            // The call-control button owns its rendered icon and button sizes.
            iconSize: _iconSize,
            size: _size,
            ...rest
          }) => (
            <CallCtrlButton
              key={actionType}
              menuPlacement={actionType === 'audio' ? 'right' : undefined}
              menuList={
                actionType === 'flip' ? (
                  <MenuList
                    onChange={(value: string) => onAction('flip', value)}
                  >
                    {flipNumbers.map((item, index) => (
                      <Option key={index} value={item.flipNumber}>
                        <MenuItemText>
                          <div className="text-neutral-b1">{item.label}</div>
                          <div className="text-neutral-b2">
                            <FormattedPhoneNumber
                              phoneNumber={item.phoneNumber}
                            />
                          </div>
                        </MenuItemText>
                      </Option>
                    ))}
                  </MenuList>
                ) : actionType === 'audio' ? (
                  AudioCard
                ) : undefined
              }
              data-sign={actionType}
              {...rest}
              value=""
            />
          ),
        )}
        {process.env.NODE_ENV === 'test' ? (
          <>
            <span data-sign="actionTypes">
              {renderActions.map((button) => button.actionType).join(',')}
            </span>
            <span data-sign="overflowActionTypes">
              {overflowActions.map((button) => button.actionType).join(',')}
            </span>
          </>
        ) : null}
      </div>
    ),
    [AudioCard, flipNumbers, onAction, overflowActions, renderActions],
  );

  if (transferringCalls) {
    return <TransferringCall {...props}>{actionButtons}</TransferringCall>;
  }

  return (
    <NormalCallControlPanel {...props} overflowActions={overflowActions}>
      {actionButtons}
    </NormalCallControlPanel>
  );
};

const NormalCallControlPanel: FC<
  CallControlViewPanelProps & { overflowActions: CallControlMoreAction[] }
> = (props) => {
  const {
    call,
    expanded,
    flipNumbers,
    onAction,
    onExpand,
    aiNoteTipType,
    viewAiNote,
    onCloseAiNoteTip,
    overflowActions,
    children,
  } = props;
  const callActions = useEmbeddableCallActionButtons(props);
  const hungUpActionProps = callActions[callActions.length - 1];

  if (
    process.env.NODE_ENV !== 'production' &&
    (!hungUpActionProps || hungUpActionProps.actionType !== 'hangUp')
  ) {
    throw new Error('The last call-control action must be hangUp');
  }

  const aiNoteTip = aiNoteTipType ? (
    <AiNoteTip
      aiNoteTipType={aiNoteTipType}
      onView={viewAiNote}
      onCloseAiNoteTip={onCloseAiNoteTip}
    />
  ) : undefined;

  const {
    actionType: _lastActionType,
    label: _label,
    ...endCallButtonProps
  } = hungUpActionProps;

  const layout = useCallControlLayout(call, {
    main: children,
    footer: (
      <>
        <CallButton
          {...endCallButtonProps}
          variant="end"
          TooltipProps={{ title: endCallButtonProps.tooltip }}
          size="medium"
          data-sign="hangUp"
        />
        {overflowActions.length > 0 ? (
          // absolutely positioned so the end call button stays centered
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <CallControlMoreButton
              actions={overflowActions}
              flipNumbers={flipNumbers}
              onAction={onAction}
            />
          </div>
        ) : null}
      </>
    ),
    onBack: () => onAction('back'),
    onConferenceClick: () => onAction('viewConferenceList'),
    aiNoteTip,
    expanded,
    onExpand,
  });

  return (
    // the layout's first child is the header line showing the duration or,
    // for a connecting (preinsert) call, a bare "connecting" text; the
    // duration span carries typography-descriptorMini itself, so apply the
    // same typography to the line to keep the connecting text the same size
    <div className="contents [&>div:first-child]:typography-descriptorMini">
      {layout}
    </div>
  );
};
