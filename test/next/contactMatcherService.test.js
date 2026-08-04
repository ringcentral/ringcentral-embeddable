jest.mock('@ringcentral-integration/micro-contacts/src/app/services', () => ({
  ContactMatcher: class ContactMatcher {
    constructor(contactMatcherOptions, storage) {
      this.contactMatcherOptions = contactMatcherOptions;
      this.storage = storage;
      this._searchProviders = new Map();
      this.searchProviderNames = [];
    }

    _updateSearchProviderNames(names) {
      this.searchProviderNames = names;
    }
  },
}));

import { ContactMatcher } from '../../next/app/services/ContactMatcher';

describe('ContactMatcher service', () => {
  test('preserves matcher options and manual refresh state', () => {
    const options = { ttl: 100, noMatchTtl: 20 };
    const storage = { enable: jest.fn() };
    const matcher = new ContactMatcher(options, storage);

    expect(matcher.contactMatcherOptions).toBe(options);
    expect(matcher.storage).toBe(storage);
    expect(matcher.manualRefreshNumber).toBeNull();

    matcher.setManualRefreshNumber('+16505550100');
    expect(matcher.manualRefreshNumber).toBe('+16505550100');

    matcher.resetManualRefreshNumber();
    expect(matcher.manualRefreshNumber).toBeNull();
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
});
