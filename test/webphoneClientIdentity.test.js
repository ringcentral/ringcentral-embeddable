import {
  isAuthoritativeWebphoneClient,
  synchronizeActiveWebphoneClient,
} from '../src/app/services/WebphoneV2/webphoneHelper';
import { SharedSipClient } from '../src/app/services/WebphoneV2/SharedSipClient';
import { SHARED_SIP_CLIENT_REQUESTS } from '../src/app/services/WebphoneV2/sharedSipClient.constants';

describe('Webphone shared-client identity', () => {
  test.each([
    [
      'rejects a SharedWorker with null identifiers',
      {
        activeWebphoneId: null,
        clientId: null,
        isActiveTab: true,
        isClient: false,
        isShared: true,
      },
      false,
    ],
    [
      'accepts the elected browser client',
      {
        activeWebphoneId: 'client-1',
        clientId: 'client-1',
        isActiveTab: false,
        isClient: true,
        isShared: true,
      },
      true,
    ],
    [
      'elects the active browser tab when no webphone client exists',
      {
        activeWebphoneId: null,
        clientId: 'client-1',
        isActiveTab: true,
        isClient: true,
        isShared: true,
      },
      true,
    ],
    [
      'rejects an inactive browser tab when no webphone client exists',
      {
        activeWebphoneId: null,
        clientId: 'client-1',
        isActiveTab: false,
        isClient: true,
        isShared: true,
      },
      false,
    ],
  ])('%s', (_name, options, expected) => {
    expect(isAuthoritativeWebphoneClient(options)).toBe(expected);
  });

  test('refreshes a stale client identity and re-elects the eligible client', async () => {
    const getActiveWebphoneId = jest.fn(async () => null);
    const setActiveWebphoneId = jest.fn(async () => {});
    const canBecomeActive = jest.fn(async () => true);

    await expect(
      synchronizeActiveWebphoneClient({
        canBecomeActive,
        clientId: 'client-1',
        getActiveWebphoneId,
        setActiveWebphoneId,
      }),
    ).resolves.toBe(true);

    expect(getActiveWebphoneId).toHaveBeenCalledTimes(1);
    expect(canBecomeActive).toHaveBeenCalledTimes(1);
    expect(setActiveWebphoneId).toHaveBeenCalledWith('client-1');
  });

  test('keeps the current election without writing it again', async () => {
    const getActiveWebphoneId = jest.fn(async () => 'client-1');
    const setActiveWebphoneId = jest.fn(async () => {});
    const canBecomeActive = jest.fn(async () => true);

    await expect(
      synchronizeActiveWebphoneClient({
        canBecomeActive,
        clientId: 'client-1',
        getActiveWebphoneId,
        setActiveWebphoneId,
      }),
    ).resolves.toBe(true);

    expect(canBecomeActive).not.toHaveBeenCalled();
    expect(setActiveWebphoneId).not.toHaveBeenCalled();
  });

  test('does not elect an ineligible or unidentified client', async () => {
    const getActiveWebphoneId = jest.fn(async () => null);
    const setActiveWebphoneId = jest.fn(async () => {});

    await expect(
      synchronizeActiveWebphoneClient({
        canBecomeActive: async () => false,
        clientId: 'client-1',
        getActiveWebphoneId,
        setActiveWebphoneId,
      }),
    ).resolves.toBe(false);
    await expect(
      synchronizeActiveWebphoneClient({
        canBecomeActive: async () => true,
        clientId: null,
        getActiveWebphoneId,
        setActiveWebphoneId,
      }),
    ).resolves.toBe(false);

    expect(setActiveWebphoneId).not.toHaveBeenCalled();
  });

  test('waits until the worker stores the elected client', async () => {
    let resolveRequest;
    const request = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    const transport = {
      emit: jest.fn(() => request),
      listen: jest.fn(() => jest.fn()),
    };
    const sharedSipClient = new SharedSipClient({
      clientId: 'application-client',
      portManager: {
        clientId: 'client-1',
        transport,
      },
    });
    let hasCompleted = false;

    const activation = sharedSipClient.setActive('client-1').then(() => {
      hasCompleted = true;
    });
    await Promise.resolve();

    expect(sharedSipClient.activeTabId).toBe('client-1');
    expect(hasCompleted).toBe(false);
    expect(transport.emit).toHaveBeenCalledWith(
      SHARED_SIP_CLIENT_REQUESTS.setActiveTabId,
      { activeTabId: 'client-1' },
    );

    resolveRequest();
    await activation;
    expect(hasCompleted).toBe(true);
  });
});
