// Server-side pieces of the Lead tab: where a lead field's recording plays
// from, and the dispositions a lead can be manually passed with.

jest.mock('../../src/ringcx/services/Analytics/track', () => ({
  track: () => (_target, _key, descriptor) => descriptor,
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({ CxAuth: class {} }));
jest.mock('../../src/ringcx/services/CxCall', () => ({ CxCall: class {} }));
jest.mock('../../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class {},
}));

import { CxClient } from '../../src/ringcx/services/CxClient/CxClient';
import { CxLeads } from '../../src/ringcx/services/CxLeads/CxLeads';

const AUTH_HOST = 'https://ringcx.example.test';
const VRU_URL =
  'https://exs.ringcentral.com/cx/interactions/assets/v1/accounts/1/sub-accounts/2/dialogs/d-1/segments/s-1/type/AudioStereo';

describe('CxClient.getRecordingAccess', () => {
  function getRecordingAccess(fileUrl, { rcAccountId = '664409314' } = {}) {
    const client = {
      _options: { authHost: AUTH_HOST },
      _sdk: {
        getAuthenticateRequest: () => ({ engageAccessToken: 'engage-token' }),
        getAgentSettings: () => ({ accountId: '15520003', guid: 'abc123' }),
      },
      getFullUserDetails: () => ({ rcAccountId }),
    };
    return CxClient.prototype.getRecordingAccess.call(client, fileUrl);
  }

  test("wraps a VRU URL in Agent One's recording-access proxy", async () => {
    await expect(getRecordingAccess(VRU_URL)).resolves.toEqual({
      url: `${AUTH_HOST}/cx/interactions/assets/delegate/v1/accounts/664409314/sub-accounts/15520003/agent/recording-access?fileUrl=${encodeURIComponent(
        VRU_URL,
      )}&guid=abc123`,
      authorization: 'Bearer engage-token',
    });
  });

  test('uses ~ for an account without an RC account id', async () => {
    const { url } = await getRecordingAccess(VRU_URL, { rcAccountId: null });

    expect(url).toContain('/accounts/~/sub-accounts/15520003/');
  });

  test('only adds the host to a value that already is a proxy path', async () => {
    const path = '/cx/interactions/assets/delegate/v1/recording-access?fileUrl=x';

    await expect(getRecordingAccess(path)).resolves.toEqual({
      url: `${AUTH_HOST}${path}`,
      authorization: 'Bearer engage-token',
    });
  });
});

describe('CxLeads.fetchManualPassDispositions', () => {
  function createLeads(getCampaignDispositions) {
    return new CxLeads(
      { getCampaignDispositions },
      { beforeAgentLogout: jest.fn() },
      { subscribe: jest.fn() },
      {},
      { danger: jest.fn(), warning: jest.fn() },
      { enable: jest.fn() },
      { shared: false },
    );
  }

  test("lists the campaign's dispositions as options", async () => {
    const getCampaignDispositions = jest.fn(async () => [
      { dispositionId: '1', disposition: 'Wrong number' },
    ]);
    const leads = createLeads(getCampaignDispositions);

    await expect(leads.fetchManualPassDispositions('campaign-1')).resolves.toEqual([
      { value: '1', label: 'Wrong number' },
    ]);
    expect(getCampaignDispositions).toHaveBeenCalledWith('campaign-1');
  });

  test('lists none when the server returns nothing', async () => {
    const leads = createLeads(async () => undefined);

    await expect(leads.fetchManualPassDispositions('campaign-1')).resolves.toEqual(
      [],
    );
  });
});
