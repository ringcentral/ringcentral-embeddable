// Modal state is synced across tabs, but each tab registers a modal's
// definition only when the module creating it loads. A tab opened while a
// RingCX modal is up must skip that modal until its CX chunk registers it.

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {
    constructor(portalHost) {
      this.portalHost = portalHost;
      this.syncedModals = [];
    }

    get modals() {
      return this.syncedModals;
    }
  },
}));

import { ModalView } from '../../src/app/views/ModalView';

function createModalView(registeredIds) {
  const portalHost = {
    getMap: jest.fn((id) => (registeredIds.has(id) ? { options: {} } : undefined)),
  };
  return new ModalView(portalHost);
}

describe('ModalView', () => {
  test('keeps the synced list while every modal is registered here', () => {
    const modalView = createModalView(new Set(['ringing']));
    const synced = [{ id: 'ringing' }];
    modalView.syncedModals = synced;

    expect(modalView.modals).toBe(synced);
  });

  test('leaves out modals whose definition this tab has not registered yet', () => {
    const registered = new Set(['settings']);
    const modalView = createModalView(registered);
    modalView.syncedModals = [{ id: 'settings' }, { id: 'cx-ringing' }];

    expect(modalView.modals).toEqual([{ id: 'settings' }]);

    // The CX chunk loads and registers the ringing modal.
    registered.add('cx-ringing');
    expect(modalView.modals).toBe(modalView.syncedModals);
  });

  test('leaves out entries without an id', () => {
    const modalView = createModalView(new Set());
    modalView.syncedModals = [{}];

    expect(modalView.modals).toEqual([]);
  });
});
