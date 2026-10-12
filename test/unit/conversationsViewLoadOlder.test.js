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
        this.useConversationItemInfo = jest.fn();
        this.useActionsHandler = jest.fn();
      }

      getUIProps() {
        // The base reports the type-wide `loadingOldConversations` flag.
        return { loadingNextPage: true, showNewButton: true };
      }

      getUIFunctions() {
        return { useActionsHandler: () => jest.fn() };
      }
    },
  }),
);

function createView(conversations) {
  const dependencies = Array(25).fill(undefined);
  dependencies[2] = conversations;
  dependencies[4] = { hasFaxesScope: true };
  dependencies[18] = { loggingMap: {}, ready: true };
  dependencies[19] = { messageLoggerRegistered: false };
  return new ConversationsView(...dependencies);
}

describe('ConversationsView older conversation paging', () => {
  test.each(['Text', 'VoiceMail', 'Fax'])(
    'loads older %s conversations when the list reaches its end',
    (typeFilter) => {
      const conversations = {
        fetchOlderConversations: jest.fn(async () => {}),
        olderConversationsLoading: {},
      };
      const view = createView(conversations);

      view.getUIFunctions({ typeFilter }).onEndReached();

      expect(conversations.fetchOlderConversations).toHaveBeenCalledWith(
        typeFilter,
      );
    },
  );

  test('reports loading for the tab being paged only', () => {
    const conversations = {
      fetchOlderConversations: jest.fn(),
      olderConversationsLoading: { Fax: true },
    };
    const view = createView(conversations);

    expect(view.getUIProps({ typeFilter: 'Fax' }).loadingNextPage).toBe(true);
    expect(view.getUIProps({ typeFilter: 'Text' }).loadingNextPage).toBe(false);
  });
});
