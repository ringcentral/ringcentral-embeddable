// SIP events reach CxIntegratedSoftphoneView on the server. Modal state is
// synced, so every tab shows a modal the server opens, and the agent's choice
// resolves on the server; `sipAnswer` then runs there and leaves call media
// with the tab the agent clicked in.

jest.mock('@ringcentral-integration/next-core', () => {
  const delegatedMethods = new Map();
  const roleDelegatedMethods = new Map();
  return {
    ...jest.requireActual('../mocks/nextCoreMock'),
    delegatedMethods,
    roleDelegatedMethods,
    delegate: (target) => (_prototype, key, descriptor) => {
      delegatedMethods.set(key, target);
      return descriptor;
    },
    delegateRole: (role) => (_prototype, key, descriptor) => {
      roleDelegatedMethods.set(key, role.role);
      return descriptor;
    },
  };
});

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
  useModalItemView: jest.fn(),
}));
jest.mock('../../src/ringcx/services/CxIntegratedSoftphone', () => ({
  CxIntegratedSoftphone: class {},
}));
jest.mock('../../src/ringcx/services/CxSubscription', () => ({
  CxSubscription: class {},
}));
jest.mock('../../src/ringcx/services/CxPresence', () => ({
  CxPresence: class {},
}));
jest.mock('../../src/ringcx/services/CxClient', () => ({ CxClient: class {} }));

import {
  delegatedMethods,
  roleDelegatedMethods,
} from '@ringcentral-integration/next-core';

import { CxIntegratedSoftphoneView } from '../../src/ringcx/views/CxIntegratedSoftphoneView/CxIntegratedSoftphoneView.view';

const payload = { displayName: 'Caller', queueName: 'Queue', isInbound: true };

function createView() {
  let resolveClosed;
  const modalView = {
    create: jest.fn((options) => options),
    open: jest.fn(() => ({
      id: 'modal-id',
      closed: new Promise((resolve) => {
        resolveClosed = resolve;
      }),
    })),
    close: jest.fn(),
  };
  const cxIntegratedSoftphone = {
    sipAnswer: jest.fn(),
    sipReject: jest.fn(),
    onRinging: jest.fn(),
    onRingingEnded: jest.fn(),
  };
  const view = new CxIntegratedSoftphoneView(
    modalView,
    cxIntegratedSoftphone,
    { subscribe: jest.fn() },
    {},
    {},
    { shared: true, onServer: jest.fn() },
  );
  return {
    view,
    modalView,
    cxIntegratedSoftphone,
    choose: async (answer) => {
      resolveClosed(answer);
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
  };
}

describe('CxIntegratedSoftphoneView ringing modal', () => {
  test('opens and closes on the port that handles SIP events', () => {
    expect(delegatedMethods.has('showRingingModal')).toBe(false);
    expect(roleDelegatedMethods.has('showRingingModal')).toBe(false);
    expect(delegatedMethods.has('closeRingingModal')).toBe(false);
  });

  test('answers on this port when the agent accepts', async () => {
    const { view, modalView, cxIntegratedSoftphone, choose } = createView();

    await view.showRingingModal(payload);
    expect(modalView.open).toHaveBeenCalledWith(expect.anything(), payload);

    await choose(true);
    expect(cxIntegratedSoftphone.sipAnswer).toHaveBeenCalledTimes(1);
    expect(cxIntegratedSoftphone.sipReject).not.toHaveBeenCalled();
  });

  test('rejects on this port when the agent declines', async () => {
    const { view, cxIntegratedSoftphone, choose } = createView();

    await view.showRingingModal(payload);
    await choose(false);

    expect(cxIntegratedSoftphone.sipReject).toHaveBeenCalledTimes(1);
    expect(cxIntegratedSoftphone.sipAnswer).not.toHaveBeenCalled();
  });

  test('opens a single modal for repeated rings', async () => {
    const { view, modalView } = createView();

    await view.showRingingModal(payload);
    await view.showRingingModal(payload);

    expect(modalView.open).toHaveBeenCalledTimes(1);
  });

  test('does not report a leg that ended on its own as a rejection', async () => {
    const { view, modalView, cxIntegratedSoftphone, choose } = createView();

    await view.showRingingModal(payload);
    await view.closeRingingModal();
    expect(modalView.close).toHaveBeenCalledTimes(1);

    await choose(false);
    expect(cxIntegratedSoftphone.sipReject).not.toHaveBeenCalled();
  });
});

describe('CxIntegratedSoftphoneView registration failed alert', () => {
  test('reloads the tab the agent last interacted with, falling back to the main client', () => {
    expect(roleDelegatedMethods.get('_reloadLastInteractedClient')).toBe(
      'lastInteractedClient',
    );
    expect(delegatedMethods.get('_reloadMainClient')).toBe('mainClient');
  });
});
