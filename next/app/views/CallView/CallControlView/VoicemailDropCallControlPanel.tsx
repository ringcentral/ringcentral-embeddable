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

import i18n from '../../VoicemailDropView/i18n';

function useEmbeddableCallActionButtons(props: CallControlViewPanelProps) {
  const { actions, call, onAction } = props;
  const { t } = useLocale(i18n);
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
  const renderActions = useMemo(() => callActions.slice(0, -1), [callActions]);

  const actionButtons = useMemo(
    () => (
      <div
        className="flex flex-wrap justify-center gap-4 px-10"
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
          <span data-sign="actionTypes">
            {renderActions.map((button) => button.actionType).join(',')}
          </span>
        ) : null}
      </div>
    ),
    [AudioCard, flipNumbers, onAction, renderActions],
  );

  const Component = transferringCalls
    ? TransferringCall
    : NormalCallControlPanel;

  return <Component {...props}>{actionButtons}</Component>;
};

const NormalCallControlPanel: FC<CallControlViewPanelProps> = (props) => {
  const {
    call,
    expanded,
    onAction,
    onExpand,
    aiNoteTipType,
    viewAiNote,
    onCloseAiNoteTip,
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

  return useCallControlLayout(call, {
    main: children,
    footer: (
      <CallButton
        {...endCallButtonProps}
        variant="end"
        TooltipProps={{ title: endCallButtonProps.tooltip }}
        size="medium"
        data-sign="hangUp"
      />
    ),
    onBack: () => onAction('back'),
    onConferenceClick: () => onAction('viewConferenceList'),
    aiNoteTip,
    expanded,
    onExpand,
  });
};
