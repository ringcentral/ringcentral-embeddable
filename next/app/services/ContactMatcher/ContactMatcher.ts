import type { Entity } from '@ringcentral-integration/commons/interfaces/Entity.interface';
import { NumberFormatter } from '@ringcentral-integration/micro-auth/src/app/services';
import {
  ContactMatcher as ContactMatcherBase,
  type ContactMatcherOptions,
  type ForceMatchNumberOptions,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  action,
  computed,
  delegate,
  getRef,
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
    numberFormatter: NumberFormatter,
    @optional('ContactMatcherOptions')
    contactMatcherOptions?: ContactMatcherOptions,
    @optional() storage?: StoragePlugin
  ) {
    super(numberFormatter, contactMatcherOptions, storage);
  }

  @state
  manualRefreshNumber: string | null = null;

  @state
  sharedSearchProviderNames: string[] = [];

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

  /** Forces matching while accepting both the current and legacy call shapes. */
  @delegate('server')
  override async forceMatchNumber(
    options: ForceMatchNumberOptions | string
  ): Promise<void> {
    const phoneNumber =
      typeof options === 'string' ? options : options?.phoneNumber;
    if (!phoneNumber?.trim()) {
      return;
    }
    await this.forceMatchBatchNumbers({ phoneNumbers: [phoneNumber] });
  }

  /** Keeps dynamic provider names available to shared client data mappings. */
  override addSearchProvider(
    options: Parameters<ContactMatcherBase<T>['addSearchProvider']>[0]
  ): void {
    super.addSearchProvider(options);
    this._syncSearchProviderNamesWhenBound();
  }

  /** Removes a provider and its shared provider-name entry. */
  removeSearchProvider(name: string): void {
    this._searchProviders.delete(name);
    this._syncSearchProviderNamesWhenBound();
  }

  private _syncSearchProviderNamesWhenBound(): void {
    if (!getRef(this).store) {
      return;
    }
    this._syncSearchProviderNames();
  }

  @action
  private _syncSearchProviderNames(): void {
    const names = [...this._searchProviders.keys()];
    this.searchProviderNames = names;
    this.sharedSearchProviderNames = names;
  }

  @computed(
    ({
      data,
      searchProviderNames,
      sharedSearchProviderNames,
    }: ContactMatcher<T>) => [
      data,
      searchProviderNames,
      sharedSearchProviderNames,
    ]
  )
  override get dataMapping(): Record<string, T[]> {
    const providerNames = new Set([
      ...this.searchProviderNames,
      ...this.sharedSearchProviderNames,
    ]);
    if (!providerNames.size) {
      return {};
    }
    const dataMapping: Record<string, T[]> = {};
    Object.entries(this.data).forEach(([query, queryResult]) => {
      const matches = [...providerNames].flatMap(
        (providerName) => queryResult[providerName]?.data ?? []
      );
      if (matches.length) {
        dataMapping[query] = matches;
      }
    });
    return dataMapping;
  }
}
