const nextCore = require('@ringcentral-integration/next-core');
const {
  ConversationLogger,
} = require('@ringcentral-integration/micro-message/src/app/services');
const { ThirdParty } = require('../src/app/services/ThirdParty');

const injectSpy = jest
  .spyOn(nextCore, 'inject')
  .mockImplementation(() => () => {});

jest.mock(
  '@ringcentral-integration/micro-core/src/app/views',
  () => ({
    ModalView: class ModalView {},
    SyncTabView: class SyncTabView {},
  }),
);
jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring/ConversationsTabs.view',
  () => ({ ConversationsTabsView: class ConversationsTabsView {} }),
);
jest.mock('../src/app/views/ConversationsView/ConversationsPage', () => ({
  ConversationsPage: () => null,
}));
jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/ConversationsViewSpring',
  () => ({
    ConversationsViewSpring: class ConversationsViewSpring {
      useActionsHandler = () => jest.fn();

      useConversationItemInfo = () => ({ actions: [], info: {} });
    },
  }),
);

require('../src/app/views/ConversationsView/Conversations.view');

describe('ConversationsView logger dependency injection', () => {
  afterAll(() => {
    injectSpy.mockRestore();
  });

  test('requires the registered logger and third-party class tokens', () => {
    expect(injectSpy).toHaveBeenCalledWith(ConversationLogger);
    expect(injectSpy).toHaveBeenCalledWith(ThirdParty);
  });
});
