import type { HistoryCall } from '@ringcentral-integration/micro-phone/src/app/services';
import type { ActionMenuListButtonProps } from '@ringcentral-integration/next-widgets/components';
import { useConnector, useContainer } from '@ringcentral-integration/next-core';
import { SmartNotesMd } from '@ringcentral/spring-icon';
import { useMemo } from 'react';

import type {
  SmartNoteContact,
  SmartNoteSession,
} from '../../services/SmartNotes';
import { SmartNotes } from '../../services/SmartNotes';

export interface SmartNotesHistoryCall extends HistoryCall {
  hasSmartNote?: boolean;
}

export interface SmartNotesCallInfo {
  renderInfo: {
    matchedContact?: SmartNoteContact;
  };
  signalSourceInfo: {
    name?: string;
    phoneNumber?: string;
  };
}

export interface SmartNotesLinkState {
  isOfflineMode: boolean;
  isVoipOnlyMode: boolean;
  isRestricted: boolean;
}

interface CreateSmartNotesActionOptions {
  call: SmartNotesHistoryCall;
  disabled: boolean;
  info: SmartNotesCallInfo;
  label: string;
  onViewSmartNote: (session: SmartNoteSession) => void;
}

export function createHistorySmartNoteSession(
  call: SmartNotesHistoryCall,
  info: SmartNotesCallInfo
): SmartNoteSession | null {
  if (!call.telephonySessionId) {
    return null;
  }
  const phoneNumber = info.signalSourceInfo.phoneNumber;
  return {
    id: call.telephonySessionId,
    status: 'Disconnected',
    direction: call.direction,
    phoneNumber,
    contact: info.renderInfo.matchedContact ?? {
      name: info.signalSourceInfo.name,
      phoneNumber,
    },
  };
}

export function areSmartNotesLinksDisabled({
  isOfflineMode,
  isVoipOnlyMode,
  isRestricted,
}: SmartNotesLinkState): boolean {
  return isOfflineMode || isVoipOnlyMode || isRestricted;
}

export function createHistorySmartNotesAction({
  call,
  disabled,
  info,
  label,
  onViewSmartNote,
}: CreateSmartNotesActionOptions): ActionMenuListButtonProps | null {
  if (!call.hasSmartNote) {
    return null;
  }
  return {
    actionType: 'viewSmartNote',
    disabled,
    shape: 'squircle',
    variant: 'outlined',
    color: 'secondary',
    size: 'medium',
    symbol: SmartNotesMd,
    label,
    'data-sign': 'viewSmartNotes',
    TooltipProps: { title: label },
    onClick: (event) => {
      event.stopPropagation();
      const session = createHistorySmartNoteSession(call, info);
      if (session) {
        onViewSmartNote(session);
      }
    },
  };
}

export function insertHistorySmartNotesAction(
  buttons: ActionMenuListButtonProps[],
  smartNotesAction: ActionMenuListButtonProps | null
): ActionMenuListButtonProps[] {
  if (!smartNotesAction) {
    return buttons;
  }
  const lastCommunicationActionIndex = buttons.reduce(
    (lastIndex, button, index) =>
      button.actionType === 'call' || button.actionType === 'text'
        ? index
        : lastIndex,
    -1
  );
  const insertionIndex = lastCommunicationActionIndex + 1;
  return [
    ...buttons.slice(0, insertionIndex),
    smartNotesAction,
    ...buttons.slice(insertionIndex),
  ];
}

export function useHistorySmartNotesAction(
  call: SmartNotesHistoryCall,
  info: SmartNotesCallInfo,
  label: string
): ActionMenuListButtonProps | null {
  const smartNotes = useContainer<SmartNotes>('SmartNotes');
  const connectivityManager = useContainer<{
    isOfflineMode: boolean;
    isVoipOnlyMode: boolean;
  }>('ConnectivityManager');
  const rateLimiter = useContainer<{ restricted: boolean }>('RateLimiter');
  const disabled = useConnector(() =>
    areSmartNotesLinksDisabled({
      isOfflineMode: connectivityManager.isOfflineMode,
      isVoipOnlyMode: connectivityManager.isVoipOnlyMode,
      isRestricted: rateLimiter.restricted,
    })
  );
  return useMemo(
    () =>
      createHistorySmartNotesAction({
        call,
        disabled,
        info,
        label,
        onViewSmartNote: (session) => {
          void smartNotes.viewSmartNote(session);
        },
      }),
    [call, disabled, info, label, smartNotes]
  );
}
