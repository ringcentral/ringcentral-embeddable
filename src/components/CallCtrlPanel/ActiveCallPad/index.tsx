import React, { useState, useRef } from 'react';
import type { FunctionComponent } from 'react';
import { recordStatus as recordStatuses } from '@ringcentral-integration/commons/modules/Webphone/recordStatus';
import {
  CallAdd as CombineIcon,
  Keypad as KeypadIcon,
  FlipSp as FlipIcon,
  Hold as HoldIcon,
  Merge as MergeIcon,
  CallMore as MoreIcon,
  ParkCall as ParkIcon,
  Mic as UnmuteIcon,
  MicOff as MuteIcon,
  Record as RecordIcon,
  StopRecord as StopRecordIcon,
  TransferCall as TransferIcon,
} from '@ringcentral/juno-icon';
import {
  styled,
  RcMenu,
  RcMenuItem,
  RcListItemText,
  RcListItemIcon,
  RcIcon,
} from '@ringcentral/juno';

import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';
import i18n from '@ringcentral-integration/widgets/components/ActiveCallPad/i18n';
import { pickElements } from '@ringcentral-integration/widgets/components/ActiveCallPad/utils';

import CallCtrlButton from '../../CallCtrlButton';

const StyledContainer = styled.div`
  margin-left: 15%;
  margin-right: 15%;
  height: auto;
  margin-top: 30px;
`;

const StyledButtonGroup = styled.div`
  width: 100%;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: space-between;
`;

const StyledCtrlButton = styled(CallCtrlButton)`
  width: 26%;
  padding-top: 26%;
`;

const DisplayButtonNumber = 6;
export const ACTIONS_CTRL_MAP = {
  muteCtrl: 'muteCtrl',
  keypadCtrl: 'keypadCtrl',
  holdCtrl: 'holdCtrl',
  mergeOrAddCtrl: 'mergeOrAddCtrl',
  recordCtrl: 'recordCtrl',
  transferCtrl: 'transferCtrl',
  flipCtrl: 'flipCtrl',
  parkCtrl: 'parkCtrl',
  completeTransferCtrl: 'completeTransferCtrl',
};
type ActiveCallPadProps = {
  currentLocale: string;
  className?: string;
  isOnMute?: boolean;
  isOnHold?: boolean;
  recordStatus: string;
  onMute: (...args: any[]) => any;
  onUnmute: (...args: any[]) => any;
  onHold: (...args: any[]) => any;
  onUnhold: (...args: any[]) => any;
  onRecord: (...args: any[]) => any;
  onStopRecord: (...args: any[]) => any;
  onHangup: (...args: any[]) => any;
  onPark: (...args: any[]) => any;
  onShowKeyPad: (...args: any[]) => any;
  onAdd?: (...args: any[]) => any;
  onMerge?: (...args: any[]) => any;
  onFlip: (...args: any[]) => any;
  onTransfer: (...args: any[]) => any;
  disableFlip?: boolean;
  showPark?: boolean;
  layout?: string;
  addDisabled?: boolean;
  mergeDisabled?: boolean;
  conferenceCallEquipped?: boolean;
  hasConferenceCall?: boolean;
  expandMore?: boolean;
  actions?: any[];
  isOnTransfer?: boolean;
  isOnWaitingTransfer?: boolean;
  onCompleteTransfer: (...args: any[]) => any;
  controlBusy?: boolean;
};

const ActiveCallPad: FunctionComponent<ActiveCallPadProps> = ({
  controlBusy,
  actions,
  currentLocale,
  isOnWaitingTransfer,
  onCompleteTransfer,
  conferenceCallEquipped,
  isOnMute,
  isOnHold,
  onUnmute,
  onMute,
  onShowKeyPad,
  layout,
  onUnhold,
  onHold,
  hasConferenceCall,
  mergeDisabled,
  onMerge,
  addDisabled,
  onAdd,
  recordStatus,
  onStopRecord,
  onRecord,
  onTransfer,
  disableFlip,
  onFlip,
  showPark,
  onPark,
  className,
  isOnTransfer,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);

  let buttons = [];
  /* --------------------- Mute/Unmute --------------------------- */
  buttons.push(
    isOnMute
      ? {
          icon: MuteIcon,
          id: ACTIONS_CTRL_MAP.muteCtrl,
          dataSign: 'mute',
          title: i18n.getString('unmute', currentLocale),
          disabled: isOnHold || controlBusy,
          onClick: onUnmute,
          active: true,
        }
      : {
          icon: UnmuteIcon,
          id: ACTIONS_CTRL_MAP.muteCtrl,
          dataSign: 'unmute',
          title: i18n.getString('mute', currentLocale),
          disabled: isOnHold || controlBusy,
          onClick: onMute,
        },
  );
  /* --------------------- keyPad --------------------------- */
  buttons.push({
    icon: KeypadIcon,
    id: ACTIONS_CTRL_MAP.keypadCtrl,
    dataSign: 'keypad',
    title: i18n.getString('keypad', currentLocale),
    onClick: onShowKeyPad,
    disabled: layout === callCtrlLayouts.conferenceCtrl,
  });
  /* --------------------- Hold/Unhold --------------------------- */
  buttons.push({
    icon: HoldIcon,
    id: ACTIONS_CTRL_MAP.holdCtrl,
    iconWidth: 120,
    iconHeight: 160,
    iconX: 190,
    iconY: 165,
    dataSign: isOnHold ? 'onHold' : 'hold',
    title: isOnHold
      ? i18n.getString('onHold', currentLocale)
      : i18n.getString('hold', currentLocale),
    active: isOnHold,
    onClick: isOnHold ? onUnhold : onHold,
    disabled: controlBusy,
  });
  if (isOnWaitingTransfer) {
    buttons.push({
      icon: TransferIcon,
      id: ACTIONS_CTRL_MAP.completeTransferCtrl,
      dataSign: 'completeTransfer',
      title: i18n.getString('completeTransfer', currentLocale),
      disabled: isOnTransfer || controlBusy,
      onClick: onCompleteTransfer,
      showRipple: true,
    });
  }
  /* --------------------- Add/Merge --------------------------- */
  if (!isOnWaitingTransfer && conferenceCallEquipped) {
    const showMerge =
      layout === callCtrlLayouts.mergeCtrl ||
      (layout === callCtrlLayouts.normalCtrl && hasConferenceCall);
    buttons.push(
      showMerge
        ? {
            icon: MergeIcon,
            id: ACTIONS_CTRL_MAP.mergeOrAddCtrl,
            dataSign: 'merge',
            title: i18n.getString('mergeToConference', currentLocale),
            disabled: mergeDisabled || controlBusy,
            onClick: onMerge,
            showRipple: !mergeDisabled,
          }
        : {
            icon: CombineIcon,
            id: ACTIONS_CTRL_MAP.mergeOrAddCtrl,
            dataSign: 'add',
            title: i18n.getString('add', currentLocale),
            disabled: addDisabled || controlBusy,
            onClick: onAdd,
          },
    );
  }
  /* --------------------- Record/Stop --------------------------- */
  buttons.push({
    icon: recordStatus === recordStatuses.recording ? StopRecordIcon : RecordIcon,
    id: ACTIONS_CTRL_MAP.recordCtrl,
    dataSign:
      recordStatus === recordStatuses.recording ? 'stopRecord' : 'record',
    title:
      recordStatus === recordStatuses.recording
        ? i18n.getString('stopRecord', currentLocale)
        : i18n.getString('record', currentLocale),
    active: recordStatus === recordStatuses.recording,
    disabled:
      isOnHold ||
      recordStatus === recordStatuses.pending ||
      layout === callCtrlLayouts.mergeCtrl ||
      recordStatus === recordStatuses.noAccess ||
      controlBusy,
    onClick:
      recordStatus === recordStatuses.recording ? onStopRecord : onRecord,
    activeColor: 'danger.b02',
  });
  /* --------------------- Transfer --------------------------- */
  const disabledTransfer = layout !== callCtrlLayouts.normalCtrl;
  if (!isOnWaitingTransfer) {
    buttons.push({
      icon: TransferIcon,
      id: ACTIONS_CTRL_MAP.transferCtrl,
      dataSign: 'transfer',
      title: i18n.getString('transfer', currentLocale),
      disabled: disabledTransfer || controlBusy,
      onClick: onTransfer,
    });
  }
  /* --------------------- Flip --------------------------- */
  const disableControlButton =
    isOnHold || layout !== callCtrlLayouts.normalCtrl;
  const disabledFlip = disableFlip || disableControlButton;
  buttons.push({
    icon: FlipIcon,
    id: ACTIONS_CTRL_MAP.flipCtrl,
    dataSign: 'flip',
    title: i18n.getString('flip', currentLocale),
    disabled: disabledFlip || controlBusy,
    onClick: onFlip,
  });
  /* --------------------- Park --------------------------- */
  if (showPark) {
    buttons.push({
      icon: ParkIcon,
      id: ACTIONS_CTRL_MAP.parkCtrl,
      dataSign: 'park',
      title: i18n.getString('park', currentLocale),
      disabled: disableControlButton || controlBusy,
      onClick: onPark,
    });
  }
  // filter actions
  if (actions.length > 0) {
    buttons = pickElements(actions, buttons);
  }
  /* --------------------- More Actions --------------------------- */
  let moreActions = null;
  if (buttons.length > DisplayButtonNumber) {
    const disableMoreButton =
      isOnWaitingTransfer ||
      (disabledFlip && disabledTransfer) ||
      controlBusy;
    moreActions = (
      <>
        <StyledCtrlButton
          onClick={() => {
            setMoreMenuOpen(!moreMenuOpen);
          }}
          icon={MoreIcon}
          dataSign="callActions"
          title={i18n.getString('more', currentLocale)}
          active={moreMenuOpen}
          disabled={disableMoreButton}
          buttonRef={moreButtonRef}
        />
        <RcMenu
          open={moreMenuOpen}
          anchorEl={moreButtonRef.current}
          onClose={() => {
            setMoreMenuOpen(false);
          }}
        >
          {
            buttons.slice(DisplayButtonNumber - 1).map(({
              id,
              title,
              icon,
              active,
              disabled,
              onClick,
              color,
              dataSign,
            }) => (
              <RcMenuItem
                key={id}
                selected={active}
                onClick={() => {
                  onClick();
                  setMoreMenuOpen(false);
                }}
                disabled={disabled}
                data-sign={dataSign}
              >
                <RcListItemIcon color={color}>
                  <RcIcon symbol={icon} size="small" />
                </RcListItemIcon>
                <RcListItemText primary={title} />
              </RcMenuItem>
            ))
          }
        </RcMenu>
      </>
    );
  }

  return (
    <StyledContainer className={className}>
      <StyledButtonGroup>
        {buttons
          .slice(0, DisplayButtonNumber - (moreActions ? 1 : 0))
          .map((opts) => (
            <StyledCtrlButton
              key={opts.title}
              {...opts}
            />
          ))}
        {moreActions}
      </StyledButtonGroup>
    </StyledContainer>
  );
}

export default ActiveCallPad;
