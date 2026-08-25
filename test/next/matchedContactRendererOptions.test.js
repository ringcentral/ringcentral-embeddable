import {
  MatchedContactSelection,
  createContactRendererOptions,
} from '../../next/app/services/MatchedContactSelection';

const RC_MATCH = { id: 'rc-1', name: 'John Smith', type: 'company' };
const CRM_MATCH = { id: 'crm-1', name: 'John Smith', resourceType: 'crm' };
const OTHER_CRM_MATCH = {
  id: 'crm-2',
  name: 'J. Smith',
  resourceType: 'other-crm',
};

const CONVERSATION = {
  conversationId: 'conversation-1',
  correspondents: [{ phoneNumber: '+16505550100' }],
  correspondentMatchesList: [[RC_MATCH, CRM_MATCH]],
};

const createOptions = (sourceName = 'crm', conversation = CONVERSATION) => {
  const selection = new MatchedContactSelection({ enable: jest.fn() });
  const conversations = {
    formattedConversationsMap: new Map(
      conversation ? [[conversation.conversationId, conversation]] : [],
    ),
    currentConversation: undefined,
  };
  const options = createContactRendererOptions(
    selection,
    { sourceName },
    conversations,
  );
  return { options, selection, conversations };
};

describe('contact renderer options', () => {
  describe('getDisplayedSelectedEntity', () => {
    test('resolves a conversation pick so "Maybe" is dropped', async () => {
      const { options, selection } = createOptions();
      await selection.select({
        scope: 'conversation',
        key: 'conversation-1',
        entityId: 'crm-1',
      });

      expect(
        options.getDisplayedSelectedEntity([], 'conversation-1'),
      ).toBe(CRM_MATCH);
    });

    test('ignores the framework-supplied matches argument', async () => {
      // The framework passes the conversation's CRM *log* records here, which
      // are empty without a message logger — resolving against them meant a
      // pick never took effect on the conversation list.
      const { options, selection } = createOptions();
      await selection.select({
        scope: 'conversation',
        key: 'conversation-1',
        entityId: 'crm-1',
      });

      expect(options.getDisplayedSelectedEntity([], 'conversation-1')).toBe(
        CRM_MATCH,
      );
      expect(
        options.getDisplayedSelectedEntity(
          [{ id: 'unrelated-log-record' }],
          'conversation-1',
        ),
      ).toBe(CRM_MATCH);
    });

    test('falls back to the current conversation on a detail page', async () => {
      // `currentConversation` only populates the flattened match list.
      const { options, selection, conversations } = createOptions('crm', null);
      conversations.currentConversation = {
        conversationId: 'conversation-1',
        correspondents: [{ phoneNumber: '+16505550100' }],
        correspondentMatches: [RC_MATCH, CRM_MATCH],
      };
      await selection.select({
        scope: 'conversation',
        key: 'conversation-1',
        entityId: 'crm-1',
      });

      expect(options.getDisplayedSelectedEntity([], 'conversation-1')).toBe(
        CRM_MATCH,
      );
    });

    test('returns undefined without a conversation id, keeping the guess', async () => {
      const { options, selection } = createOptions();
      await selection.select({
        scope: 'conversation',
        key: 'conversation-1',
        entityId: 'crm-1',
      });

      expect(
        options.getDisplayedSelectedEntity([RC_MATCH, CRM_MATCH], undefined),
      ).toBeUndefined();
    });

    test('returns undefined for an unpicked conversation', () => {
      const { options } = createOptions();

      expect(
        options.getDisplayedSelectedEntity([], 'conversation-1'),
      ).toBeUndefined();
    });

    test('returns undefined for a group thread', async () => {
      const { options, selection } = createOptions('crm', {
        conversationId: 'conversation-2',
        correspondents: [{ phoneNumber: '+1' }, { phoneNumber: '+2' }],
        correspondentMatchesList: [[RC_MATCH, CRM_MATCH]],
      });
      await selection.select({
        scope: 'conversation',
        key: 'conversation-2',
        entityId: 'crm-1',
      });

      expect(
        options.getDisplayedSelectedEntity([], 'conversation-2'),
      ).toBeUndefined();
    });
  });

  describe('getDefaultCrmMatch', () => {
    test('prefers the registered service over another CRM', () => {
      const { options } = createOptions('crm');

      expect(
        options.getDefaultCrmMatch([RC_MATCH, OTHER_CRM_MATCH, CRM_MATCH]),
      ).toBe(CRM_MATCH);
    });

    test('falls back to any CRM match when the service did not match', () => {
      const { options } = createOptions('crm');

      expect(options.getDefaultCrmMatch([RC_MATCH, OTHER_CRM_MATCH])).toBe(
        OTHER_CRM_MATCH,
      );
    });

    test('falls back to the first match with no CRM match at all', () => {
      const { options } = createOptions(null);

      expect(options.getDefaultCrmMatch([RC_MATCH, { id: 'rc-2' }])).toBe(
        RC_MATCH,
      );
    });

    test('returns undefined for an empty match list', () => {
      const { options } = createOptions();

      expect(options.getDefaultCrmMatch([])).toBeUndefined();
      expect(options.getDefaultCrmMatch(undefined)).toBeUndefined();
    });
  });
});
