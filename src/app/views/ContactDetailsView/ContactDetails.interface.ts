import type { AppsMd } from '@ringcentral/spring-icon';

type SpringIconSymbol = typeof AppsMd;

/**
 * A `contactAction` button registered by the third-party service.
 */
export interface ContactAdditionalAction {
  readonly id: string;
  readonly label?: string;
  /** One of `call`, `text`, `apps`, `clock`, or `calendar`. */
  readonly icon?: string;
}

/**
 * A button on a contact's phone row.
 */
export interface PhoneAction {
  readonly id: string;
  readonly title: string;
  readonly symbol: SpringIconSymbol;
  readonly disabled: boolean;
  readonly onClick: () => void;
}

/**
 * An item returned by the third-party service's `activitiesPath`.
 */
export interface ContactActivity {
  readonly id?: string | number;
  readonly subject?: string;
  /** Epoch milliseconds. */
  readonly time?: number;
  readonly [key: string]: unknown;
}

/**
 * The third-party service features shown on the contact details page.
 */
export interface ContactThirdPartyProps {
  additionalActions: ContactAdditionalAction[];
  onClickAdditionalAction: (
    buttonId: string,
    resource: Record<string, unknown>,
  ) => void;
  showActivities: boolean;
  activitiesTabName: string;
  activities: ContactActivity[];
  activitiesLoaded: boolean;
  loadActivities: () => void;
  openActivity: (activity: ContactActivity) => void;
  formatActivityTime: (time: number) => string;
}
