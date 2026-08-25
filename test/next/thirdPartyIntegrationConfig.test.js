import { createThirdPartyIntegrationConfig } from '../../next/app/services/ThirdParty/ThirdParty.integrationConfig';

describe('third-party integration configuration', () => {
  test('uses the registered service name as the contact-search source key', () => {
    const thirdParty = {
      displayName: null,
      sourceName: null,
    };
    const config = createThirdPartyIntegrationConfig(thirdParty);

    expect(config.key).toBe('thirdParty');
    expect(config.name).toBeUndefined();

    thirdParty.sourceName = 'crm';
    thirdParty.displayName = 'CRM Display';

    expect(config.key).toBe('crm');
    expect(config.name).toBe('CRM Display');
  });

  test('falls back to the service name for the result tab label', () => {
    const config = createThirdPartyIntegrationConfig({
      displayName: null,
      sourceName: 'crm',
    });

    expect(config.name).toBe('crm');
  });

  describe('matched-contact viewing', () => {
    const CRM_MATCH = { id: 'lead-1', type: 'lead', resourceType: 'crm' };

    const createConfig = (overrides = {}) => {
      const thirdParty = {
        displayName: 'CRM Display',
        sourceName: 'crm',
        viewMatchedContactExternal: true,
        matchedContactEntityTypes: ['lead', 'contact'],
        onViewMatchedContactExternal: jest.fn(),
        ...overrides,
      };
      return {
        config: createThirdPartyIntegrationConfig(thirdParty),
        thirdParty,
      };
    };

    test('adds the service types without dropping the RC directory ones', () => {
      // Both the clickable name and the viewEntity action button are gated on
      // this list; dropping the RC types would flip those rows to addEntity.
      const { config } = createConfig();

      expect(config.viewableEntityTypes).toEqual([
        'company',
        'personal',
        'lead',
        'contact',
      ]);
    });

    test('keeps only the RC defaults until a view path is registered', () => {
      const { config } = createConfig({ viewMatchedContactExternal: false });

      expect(config.viewableEntityTypes).toEqual(['company', 'personal']);
    });

    test('forwards a resolved match to the registered service', () => {
      const { config, thirdParty } = createConfig();

      config.onViewEntity(CRM_MATCH);

      expect(thirdParty.onViewMatchedContactExternal).toHaveBeenCalledWith(
        CRM_MATCH,
      );
    });

    test('does not forward a "Maybe" guess the user never chose', () => {
      const { config, thirdParty } = createConfig();

      config.onViewEntity(CRM_MATCH, { isMaybeMatch: true });

      expect(thirdParty.onViewMatchedContactExternal).not.toHaveBeenCalled();
    });

    test('does not forward records that are not the service’s own', () => {
      const { config, thirdParty } = createConfig();

      // RC directory match: no counterpart across the postMessage bridge.
      config.onViewEntity({ id: 'rc-1', type: 'company' });
      // Another provider's match.
      config.onViewEntity({ id: 'x-1', resourceType: 'other-crm' });

      expect(thirdParty.onViewMatchedContactExternal).not.toHaveBeenCalled();
    });

    test('ignores entities with no id and unregistered services', () => {
      const { config, thirdParty } = createConfig();
      config.onViewEntity(undefined);
      config.onViewEntity({ type: 'lead', resourceType: 'crm' });
      expect(thirdParty.onViewMatchedContactExternal).not.toHaveBeenCalled();

      const unregistered = createConfig({ viewMatchedContactExternal: false });
      unregistered.config.viewExternalEntity(CRM_MATCH);
      expect(
        unregistered.thirdParty.onViewMatchedContactExternal,
      ).not.toHaveBeenCalled();

      const anonymous = createConfig({ sourceName: null });
      anonymous.config.viewExternalEntity(CRM_MATCH);
      expect(
        anonymous.thirdParty.onViewMatchedContactExternal,
      ).not.toHaveBeenCalled();
    });

    test('forwards per-row view-record clicks from a match list', () => {
      const { config, thirdParty } = createConfig();
      const entity = { id: 'contact-1', type: 'contact', resourceType: 'crm' };

      config.viewExternalEntity(entity);

      expect(thirdParty.onViewMatchedContactExternal).toHaveBeenCalledWith(
        entity,
      );
    });
  });
});
