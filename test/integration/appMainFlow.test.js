/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/react';

import {
  connectWebphone,
  createAppInstance,
  destroyAppInstance,
  loginApp,
} from './helpers/createAppInstance';
import { installSharedWorkerMock } from '../mocks/SharedWorkerMock';

describe('App main flow integration', () => {
  let instance;
  let sharedWorkerMock;

  afterEach(() => {
    if (instance) {
      destroyAppInstance(instance);
      instance = null;
    }
    if (sharedWorkerMock) {
      sharedWorkerMock.restore();
      sharedWorkerMock = null;
    }
  });

  it('renders the real app and opens the dialer after mocked login', async () => {
    instance = await createAppInstance();

    expect(screen.getByTestId('loginButton')).toBeInTheDocument();

    await loginApp(instance);

    await waitFor(() => {
      expect(instance.phone.routerInteraction.currentPath).toBe('/dialer');
      expect(screen.getByTestId('dialPad')).toBeInTheDocument();
    });
    expect(screen.getByTestId('callButton')).toBeInTheDocument();
  });

  it('connects the real WebphoneV2 module and creates an outbound webphone session', async () => {
    instance = await createAppInstance();

    await loginApp(instance);
    await connectWebphone(instance);

    const session = await instance.phone.webphone.makeCall({
      toNumber: '101',
      fromNumber: '+16505550100',
      homeCountryId: '1',
    });

    expect(instance.phone.webphone.connected).toBe(true);
    expect(instance.phone.webphone.connectionStatus).toBe('connectionStatus-connected');
    expect(instance.phone.webphone.webphoneSessions).toHaveLength(1);
    expect(session.callId).toBe(instance.phone.webphone.webphoneSessions[0].callId);
    expect(instance.phone.webphone.sessions[0]).toEqual(
      expect.objectContaining({
        callId: session.callId,
        to: '101',
        from: '+16505550100',
      }),
    );
  });

  it('connects WebphoneV2 through SharedWorker and creates an outbound session', async () => {
    sharedWorkerMock = installSharedWorkerMock();
    instance = await createAppInstance();

    await loginApp(instance);
    await connectWebphone(instance);

    expect(sharedWorkerMock.workers).toHaveLength(1);
    expect(sharedWorkerMock.latestWorker.options).toEqual({
      name: 'ringcentral-webphone-shared-sip-client',
    });
    expect(instance.phone.webphone.connected).toBe(true);
    expect(instance.phone.webphone.activeWebphoneId).toBe(
      instance.phone.tabManager.tabbie.id,
    );
    expect(sharedWorkerMock.latestWorker.state.requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'getSipClientStatus' }),
        expect.objectContaining({ type: 'startSipClient' }),
        expect.objectContaining({ type: 'getSharedState' }),
      ]),
    );

    const session = await instance.phone.webphone.makeCall({
      toNumber: '102',
      fromNumber: '+16505550101',
      homeCountryId: '1',
    });

    expect(instance.phone.webphone.webphoneSessions).toHaveLength(1);
    expect(instance.phone.webphone.sessions[0]).toEqual(
      expect.objectContaining({
        callId: session.callId,
        to: '102',
        from: '+16505550101',
      }),
    );
    expect(sharedWorkerMock.latestWorker.state.sharedState.sessions).toHaveLength(1);
  });
});
