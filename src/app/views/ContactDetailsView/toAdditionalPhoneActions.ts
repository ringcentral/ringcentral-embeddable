import {
  AppsMd,
  CalendarMd,
  CallMd,
  ClockMd,
  Smsmd,
} from '@ringcentral/spring-icon';

import type {
  ContactAdditionalAction,
  PhoneAction,
} from './ContactDetails.interface';

/** The icon names the 3.x contact page accepted for `contactAction` buttons. */
const ADDITIONAL_ACTION_ICONS: Readonly<Record<string, PhoneAction['symbol']>> = {
  call: CallMd,
  text: Smsmd,
  apps: AppsMd,
  clock: ClockMd,
  calendar: CalendarMd,
};

/**
 * Turn the service's `contactAction` buttons into phone row actions.
 */
export function toAdditionalPhoneActions({
  actions,
  disabled,
  onClick,
}: {
  actions: ContactAdditionalAction[];
  disabled: boolean;
  onClick: (buttonId: string) => void;
}): PhoneAction[] {
  return actions.map((action) => ({
    id: action.id,
    title: action.label || action.id,
    symbol: (action.icon && ADDITIONAL_ACTION_ICONS[action.icon]) || AppsMd,
    disabled,
    onClick: () => onClick(action.id),
  }));
}
