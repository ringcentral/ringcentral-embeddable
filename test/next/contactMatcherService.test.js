jest.mock('@ringcentral-integration/micro-contacts/src/app/services', () => ({
  ContactMatcher: class ContactMatcher {
    constructor(numberFormatter, contactMatcherOptions, storage) {
      this.numberFormatter = numberFormatter;
      this.contactMatcherOptions = contactMatcherOptions;
      this.storage = storage;
      this._searchProviders = new Map();
      this.searchProviderNames = [];
      this.data = {};
      this.ready = false;
      this.forceMatchBatchNumbers = jest.fn();
    }

    addSearchProvider(provider) {
      this._searchProviders.set(provider.name, provider);
      if (this.ready) {
        this.searchProviderNames.push(provider.name);
      }
    }
  },
}));

import { getRef } from '@ringcentral-integration/next-core';
import { ContactMatcher } from '../../next/app/services/ContactMatcher';

describe('ContactMatcher service', () => {
  beforeEach(() => {
    getRef.mockReturnValue({ store: {} });
  });

  test('preserves matcher options and manual refresh state', () => {
    const options = { ttl: 100, noMatchTtl: 20 };
    const storage = { enable: jest.fn() };
    const numberFormatter = { normalizeNumber: jest.fn() };
    const matcher = new ContactMatcher(numberFormatter, options, storage);

    expect(matcher.numberFormatter).toBe(numberFormatter);
    expect(matcher.contactMatcherOptions).toBe(options);
    expect(matcher.storage).toBe(storage);
    expect(matcher.manualRefreshNumber).toBeNull();

    matcher.setManualRefreshNumber('+16505550100');
    expect(matcher.manualRefreshNumber).toBe('+16505550100');

    matcher.resetManualRefreshNumber();
    expect(matcher.manualRefreshNumber).toBeNull();
  });

  test('normalizes string and object force-match arguments', async () => {
    const matcher = new ContactMatcher();

    await matcher.forceMatchNumber('+16579991394');
    await matcher.forceMatchNumber({ phoneNumber: '+16505550100' });
    await matcher.forceMatchNumber('');

    expect(matcher.forceMatchBatchNumbers).toHaveBeenNthCalledWith(1, {
      phoneNumbers: ['+16579991394'],
    });
    expect(matcher.forceMatchBatchNumbers).toHaveBeenNthCalledWith(2, {
      phoneNumbers: ['+16505550100'],
    });
    expect(matcher.forceMatchBatchNumbers).toHaveBeenCalledTimes(2);
  });

  test('removes a provider from the registry and shared provider names', () => {
    const matcher = new ContactMatcher();
    matcher._searchProviders.set('company', {});
    matcher._searchProviders.set('crm', {});
    matcher.searchProviderNames = ['company', 'crm'];

    matcher.removeSearchProvider('crm');

    expect(matcher._searchProviders.has('crm')).toBe(false);
    expect(matcher.searchProviderNames).toEqual(['company']);

    matcher.searchProviderNames = ['company', 'missing'];
    matcher.removeSearchProvider('missing');
    expect(matcher.searchProviderNames).toEqual(['company']);
  });

  test('shares a dynamic provider name before the matcher is ready', () => {
    const matcher = new ContactMatcher();

    matcher.addSearchProvider({
      name: 'rcContact',
      searchFn: jest.fn(),
      readyCheckFn: () => true,
    });

    expect(matcher._searchProviders.has('rcContact')).toBe(true);
    expect(matcher.searchProviderNames).toEqual(['rcContact']);
    expect(matcher.sharedSearchProviderNames).toEqual(['rcContact']);
  });

  test('defers provider-name actions until the matcher is store-bound', () => {
    const matcher = new ContactMatcher();
    getRef.mockReturnValue({});

    matcher.addSearchProvider({
      name: 'contacts',
      searchFn: jest.fn(),
      readyCheckFn: () => true,
    });

    expect(matcher._searchProviders.has('contacts')).toBe(true);
    expect(matcher.searchProviderNames).toEqual([]);
  });

  test('maps synchronized provider data while matcher readiness is pending', () => {
    const matcher = new ContactMatcher();
    matcher.sharedSearchProviderNames = ['rcContact'];
    matcher.data = {
      '+16505550100': {
        contacts: { _t: 1, data: [{ id: 'company' }] },
        rcContact: {
          _t: 1,
          data: [{ id: 'third-party', name: 'Ada' }],
        },
      },
    };

    expect(matcher.ready).toBe(false);
    expect(matcher.dataMapping).toEqual({
      '+16505550100': [{ id: 'third-party', name: 'Ada' }],
    });
  });
});
