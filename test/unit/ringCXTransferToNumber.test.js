// Transfer of a RingCX call to a number the host app gives with
// `rc-adapter-control-call`: sent the way a typed number on the Manual entry
// tab is, without touching the transfer page's selection.

// Module barrels stand in for DI tokens only. The real CxTransferCall is
// imported from its own file below, which these do not cover.
jest.mock('../../src/ringcx/services/CxClient', () => ({
  CxClient: class CxClient {},
}));
jest.mock('../../src/ringcx/services/CxAuth', () => ({
  CxAuth: class CxAuth {},
}));
jest.mock('../../src/ringcx/services/CxCall', () => ({
  CxCall: class CxCall {},
}));
jest.mock('../../src/ringcx/services/CxActiveCallControl', () => ({
  CxActiveCallControl: class CxActiveCallControl {},
}));
jest.mock('../../src/ringcx/services/CxWorkingState', () => ({
  CxWorkingState: class CxWorkingState {},
}));
jest.mock('../../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class CxSubscription {},
}));
jest.mock('../../src/ringcx/services/CxAgentSession', () => ({
  CxAgentSession: class CxAgentSession {},
}));

import { CxTransferCall } from '../../src/ringcx/services/CxTransferCall/CxTransferCall';
import {
  directTransferTypes,
  transferStatuses,
  transferTypes,
} from '../../src/ringcx/enums';

const TRANSFER_NUMBER = '+16505550100';

function createTransferCall({ agentPermissions = {}, currentCall = null } = {}) {
  const calls = [];
  const cxClient = {
    coldTransferCall: jest.fn(async () => {
      calls.push('coldTransferCall');
    }),
    warmTransferCall: jest.fn(async () => {
      calls.push('warmTransferCall');
    }),
    coldTransferIntlCall: jest.fn(),
    warmTransferIntlCall: jest.fn(),
    voicemailTransferCall: jest.fn(),
  };
  const cxAuth = {
    availableCountries: [{ countryId: 'USA', countryCode: '1' }],
    agentPermissions,
  };
  const cxActiveCallControl = {
    holdAndConfirm: jest.fn(async () => {
      calls.push('holdAndConfirm');
    }),
    setUnholdOnHangup: jest.fn(),
  };
  const transferCall = new CxTransferCall(
    cxClient,
    cxAuth,
    { currentCall },
    cxActiveCallControl,
    {},
    {},
    {},
    {},
    {},
    { enable: jest.fn() },
  );
  return { transferCall, cxClient, cxActiveCallControl, calls };
}

describe('CxTransferCall transferToNumber', () => {
  test('cold transfers to the parsed number', async () => {
    const { transferCall, cxClient } = createTransferCall();

    await expect(
      transferCall.transferToNumber('(650) 555-0100', directTransferTypes.COLD),
    ).resolves.toBe(true);

    expect(cxClient.coldTransferCall).toHaveBeenCalledWith({
      dialDest: TRANSFER_NUMBER,
    });
    expect(transferCall.transferStatus).toBe(transferStatuses.idle);
  });

  test('warm transfers after holding the customer when the account asks', async () => {
    const { transferCall, cxClient, calls } = createTransferCall({
      agentPermissions: { allowWarmXferOnHold: true },
    });

    await expect(
      transferCall.transferToNumber(TRANSFER_NUMBER, directTransferTypes.WARM),
    ).resolves.toBe(true);

    expect(cxClient.warmTransferCall).toHaveBeenCalledWith({
      dialDest: TRANSFER_NUMBER,
    });
    expect(calls).toEqual(['holdAndConfirm', 'warmTransferCall']);
  });

  test('leaves the transfer page selection alone', async () => {
    const { transferCall } = createTransferCall();
    transferCall.changeTransferType(transferTypes.phoneBook);
    transferCall.changeTransferPhoneBookSelected(2);
    transferCall.changeRecipientNumber('+16505550199');

    await transferCall.transferToNumber(
      TRANSFER_NUMBER,
      directTransferTypes.COLD,
    );

    expect(transferCall.transferType).toBe(transferTypes.phoneBook);
    expect(transferCall.transferPhoneBookSelectedIndex).toBe(2);
    expect(transferCall.transferRecipientNumber).toBe('+16505550199');
  });

  test.each([
    ['a number in a country the agent cannot transfer to', '+442079460958'],
    ['an invalid number', 'not-a-number'],
  ])('reports %s as not sent', async (_name, phoneNumber) => {
    const { transferCall, cxClient } = createTransferCall();

    await expect(
      transferCall.transferToNumber(phoneNumber, directTransferTypes.COLD),
    ).resolves.toBe(false);

    expect(cxClient.coldTransferCall).not.toHaveBeenCalled();
    expect(cxClient.coldTransferIntlCall).not.toHaveBeenCalled();
    expect(transferCall.transferStatus).toBe(transferStatuses.idle);
  });

  test('reports a transfer the server rejects as not sent', async () => {
    const { transferCall, cxClient } = createTransferCall();
    cxClient.coldTransferCall.mockRejectedValue(new Error('rejected'));

    await expect(
      transferCall.transferToNumber(TRANSFER_NUMBER, directTransferTypes.COLD),
    ).resolves.toBe(false);

    expect(transferCall.transferStatus).toBe(transferStatuses.idle);
  });

  test('refuses while another transfer is in progress', async () => {
    const { transferCall, cxClient } = createTransferCall();
    transferCall.setTransferStatus(transferStatuses.loading);

    await expect(
      transferCall.transferToNumber(TRANSFER_NUMBER, directTransferTypes.COLD),
    ).resolves.toBe(false);

    expect(cxClient.coldTransferCall).not.toHaveBeenCalled();
  });

  test('refuses a voicemail transfer', async () => {
    const { transferCall, cxClient } = createTransferCall();

    await expect(
      transferCall.transferToNumber(
        TRANSFER_NUMBER,
        directTransferTypes.VOICEMAIL,
      ),
    ).resolves.toBe(false);

    expect(cxClient.voicemailTransferCall).not.toHaveBeenCalled();
  });
});
