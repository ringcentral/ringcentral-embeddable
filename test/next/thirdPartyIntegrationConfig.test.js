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
});
