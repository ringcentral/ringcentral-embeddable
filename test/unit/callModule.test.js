const { callErrors } = require('@ringcentral-integration/commons/modules/Call/callErrors');
const { callStatus } = require('@ringcentral-integration/commons/modules/Call/callStatus');
const { callingModes } = require('@ringcentral-integration/commons/modules/CallingSettings/callingModes');
const { ringoutErrors } = require('@ringcentral-integration/commons/modules/Ringout/ringoutErrors');
const { setStagedState } = require('@ringcentral-integration/core/lib/usm-redux/utils');

const { Call } = require('../../src/modules/Call');

function createAlert() {
  return {
    danger: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  };
}

function createDeps(overrides = {}) {
  return {
    alert: createAlert(),
    appFeatures: {
      isEDPEnabled: false,
    },
    availabilityMonitor: {
      checkIfHAError: jest.fn(async () => false),
    },
    brand: {
      brandConfig: {
        allowRegionSettings: true,
      },
    },
    callingSettings: {
      callingMode: callingModes.ringout,
      fromNumber: '+16505550100',
      isRingoutCallerIdEnabled: true,
      myLocation: '+16505550100',
      ringoutPrompt: true,
    },
    regionSettings: {
      areaCode: '650',
      countryCode: 'US',
    },
    ringout: {
      makeCall: jest.fn(async () => ({ id: 'ringout-call' })),
    },
    ...overrides,
  };
}

function createCall({ deps = createDeps() } = {}) {
  const call = Object.create(Call.prototype);
  Object.assign(call, {
    _callSettingMode: deps.callingSettings.callingMode,
    _deps: deps,
    callStatus: callStatus.idle,
    data: {
      lastPhoneNumber: null,
      lastRecipient: null,
      lastValidatedToNumber: null,
    },
    // the real implementation only validates/parses numbers, which is not
    // what these cases are about
    _getNumbers: jest.fn(({ toNumber, fromNumber }) => ({
      toNumber,
      fromNumber: fromNumber || '+16505550100',
    })),
    parentModule: {
      analytics: {
        getTrackTarget: jest.fn(() => ({ router: '/dialer' })),
        track: jest.fn(),
      },
    },
    toNumberEntities: [],
  });
  return call;
}

function createResponseError({ message, body, status }) {
  return {
    message,
    response: {
      status,
      clone: () => ({
        json: async () => body,
      }),
    },
  };
}

async function expectCallToReject(call, error) {
  call._deps.ringout.makeCall.mockRejectedValue(error);
  await expect(
    call.call({ phoneNumber: '+16505550123', fromNumber: '+16505550100' }),
  ).rejects.toBe(error);
}

describe('Call module internalError alert', () => {
  beforeEach(() => {
    setStagedState({});
  });

  afterEach(() => {
    setStagedState(undefined);
    jest.restoreAllMocks();
  });

  it('alerts internalError for an uncategorized failure when an availability monitor is registered', async () => {
    const call = createCall();
    const error = new Error('Timeout');

    await expectCallToReject(call, error);

    expect(call._deps.availabilityMonitor.checkIfHAError).toHaveBeenCalledWith(
      error,
    );
    expect(call._deps.alert.danger).toHaveBeenCalledTimes(1);
    expect(call._deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({
        message: callErrors.internalError,
        payload: error,
      }),
    );
    expect(call.callStatus).toBe(callStatus.idle);
  });

  it('does not alert when the error is handled by the availability monitor', async () => {
    const call = createCall();
    call._deps.availabilityMonitor.checkIfHAError.mockResolvedValue(true);

    await expectCallToReject(call, new Error('Service unavailable'));

    expect(call._deps.alert.danger).not.toHaveBeenCalled();
    expect(call._deps.alert.warning).not.toHaveBeenCalled();
  });

  it('keeps the base class alert for a network error', async () => {
    const call = createCall();

    await expectCallToReject(call, new Error('Failed to fetch'));

    expect(call._deps.alert.danger).toHaveBeenCalledTimes(1);
    expect(call._deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({ message: callErrors.networkError }),
    );
  });

  it('keeps the base class alert for a ringout first leg failure', async () => {
    const call = createCall();

    await expectCallToReject(
      call,
      new Error(ringoutErrors.firstLegConnectFailed),
    );

    expect(call._deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({ message: callErrors.connectFailed }),
    );
    expect(call._deps.alert.danger).not.toHaveBeenCalled();
  });

  it('keeps the base class alert for a number validation error', async () => {
    const call = createCall();

    await expectCallToReject(call, { type: 'noAreaCode' });

    expect(call._deps.alert.warning).toHaveBeenCalledWith(
      expect.objectContaining({ message: callErrors.noAreaCode }),
    );
    expect(call._deps.alert.danger).not.toHaveBeenCalled();
  });

  it('keeps the base class alert for a missing international calling permission', async () => {
    const call = createCall();

    await expectCallToReject(
      call,
      createResponseError({
        message: 'Forbidden',
        body: { feature: 'InternationalCalls' },
        status: 403,
      }),
    );

    expect(call._deps.alert.danger).toHaveBeenCalledTimes(1);
    expect(call._deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({ message: callErrors.noInternational }),
    );
  });

  it('does not alert when the refresh token has expired', async () => {
    const call = createCall();

    await expectCallToReject(call, new Error('Refresh token has expired'));

    expect(call._deps.alert.danger).not.toHaveBeenCalled();
    expect(call._deps.alert.warning).not.toHaveBeenCalled();
  });

  it('alerts internalError on a server error carrying an unrelated response body', async () => {
    const call = createCall();
    const error = createResponseError({
      message: 'Internal Server Error',
      body: { errorCode: 'CMN-102' },
      status: 500,
    });

    await expectCallToReject(call, error);

    expect(call._deps.alert.danger).toHaveBeenCalledTimes(1);
    expect(call._deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({
        message: callErrors.internalError,
        payload: error,
      }),
    );
  });

  it('still alerts internalError when no availability monitor is registered', async () => {
    const call = createCall({
      deps: createDeps({ availabilityMonitor: null }),
    });

    await expectCallToReject(call, new Error('Timeout'));

    expect(call._deps.alert.danger).toHaveBeenCalledTimes(1);
    expect(call._deps.alert.danger).toHaveBeenCalledWith(
      expect.objectContaining({ message: callErrors.internalError }),
    );
  });
});
