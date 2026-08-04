import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import {
  ContactMatcher as ContactMatcherBase,
  type ContactMatcherOptions,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  action,
  injectable,
  optional,
  state,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

@injectable({
  name: 'ContactMatcher',
})
export class ContactMatcher<T = Entity> extends ContactMatcherBase<T> {
  constructor(
    @optional('ContactMatcherOptions')
    contactMatcherOptions?: ContactMatcherOptions,
    @optional() storage?: StoragePlugin
  ) {
    super(contactMatcherOptions, storage);
  }

  @state
  manualRefreshNumber: string | null = null;

  /** Marks a number so third-party matching can identify a manual refresh. */
  @action
  setManualRefreshNumber(phoneNumber: string): void {
    this.manualRefreshNumber = phoneNumber;
  }

  /** Clears the number marked for manual refresh. */
  @action
  resetManualRefreshNumber(): void {
    this.manualRefreshNumber = null;
  }

  /** Removes a provider and its shared provider-name entry. */
  removeSearchProvider(name: string): void {
    this._searchProviders.delete(name);
    this._updateSearchProviderNames([...this._searchProviders.keys()]);
  }
}
