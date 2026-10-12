import { ConversationsView } from '../../src/app/views/ConversationsView';

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
  SyncTabView: class SyncTabView {},
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsTabs.view',
  () => ({ ConversationsTabsView: class ConversationsTabsView {} }),
);

// Not under test here, and its framework page imports pull in untransformed ESM.
jest.mock('../../src/app/views/ConversationsView/ConversationsPage', () => ({
  ConversationsPage: () => null,
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring',
  () => ({
    ConversationsViewSpring: class ConversationsViewSpringBase {
      constructor(...dependencies) {
        this._conversations = dependencies[2];
        this._appFeatures = dependencies[4];
      }

      getUIProps() {
        return { showNewButton: true };
      }
    },
  }),
);

function createView(appFeatures) {
  const dependencies = Array(25).fill(undefined);
  dependencies[2] = { olderConversationsLoading: {} };
  dependencies[4] = appFeatures;
  dependencies[18] = { loggingMap: {}, ready: true };
  dependencies[19] = { messageLoggerRegistered: false };
  return new ConversationsView(...dependencies);
}

describe('ConversationsView new fax button', () => {
  test.each([true, false])(
    'follows canSendFax (%s) on the Fax tab',
    (canSendFax) => {
      const view = createView({ canSendFax });

      expect(view.getUIProps({ typeFilter: 'Fax' }).showNewButton).toBe(
        canSendFax,
      );
    },
  );

  test('keeps the base new button on the Text tab', () => {
    const view = createView({ canSendFax: false });

    expect(view.getUIProps({ typeFilter: 'Text' }).showNewButton).toBe(true);
  });
});
