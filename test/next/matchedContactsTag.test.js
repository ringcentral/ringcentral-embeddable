import { fireEvent, render, screen } from '@testing-library/react';
import { useContainer } from '@ringcentral-integration/next-core';
import React from 'react';

import {
  ConversationMatchedContactsTag,
  MatchedContactsTag,
  useCallDisplayNameWithMatches,
  useConversationDisplayNameWithMatches,
} from '../../next/app/components/MatchedContactsTag';
import { MatchedContactSelection } from '../../next/app/services/MatchedContactSelection';

const MATCHES = [
  { id: 'rc-1', name: 'John Smith', type: 'company' },
  { id: 'crm-1', name: 'John Smith', type: 'lead' },
  { id: 'crm-2', name: 'J. Smith', type: 'contact' },
];

let selection;

beforeEach(() => {
  selection = new MatchedContactSelection({ enable: jest.fn() });
  useContainer.mockImplementation((token) =>
    token === 'MatchedContactSelection' ? selection : undefined,
  );
});

afterEach(() => {
  useContainer.mockReset();
});

describe('MatchedContactsTag', () => {
  test('renders nothing when there is nothing to disambiguate', () => {
    const { container, rerender } = render(
      <MatchedContactsTag scope="call" recordKey="session-1" matches={[]} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(
      <MatchedContactsTag
        scope="call"
        recordKey="session-1"
        matches={[MATCHES[0]]}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('counts only matches that can be selected', () => {
    render(
      <MatchedContactsTag
        scope="call"
        recordKey="session-1"
        matches={[...MATCHES, { name: 'No id' }]}
      />,
    );

    expect(screen.getByRole('button')).toHaveTextContent('matches');
  });

  test('opens the match list and records the pick', () => {
    render(
      <MatchedContactsTag
        scope="call"
        recordKey="session-1"
        matches={MATCHES}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('J. Smith'));

    expect(selection.getSelectedEntityId('call', 'session-1')).toBe('crm-2');
  });

  test('does not trigger the surrounding row while picking', () => {
    // The row navigates to the call detail page on click, and the menu's
    // events bubble up this component tree even though it renders in a portal.
    const onRowClick = jest.fn();
    render(
      <div onClick={onRowClick}>
        <MatchedContactsTag
          scope="call"
          recordKey="session-1"
          matches={MATCHES}
        />
      </div>,
    );

    fireEvent.click(screen.getByRole('button'));
    expect(onRowClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('J. Smith'));

    expect(selection.getSelectedEntityId('call', 'session-1')).toBe('crm-2');
    expect(onRowClick).not.toHaveBeenCalled();
  });

  test('clicking the current pick clears it, restoring the guess', () => {
    selection.select({ scope: 'call', key: 'session-1', entityId: 'crm-1' });
    render(
      <MatchedContactsTag
        scope="call"
        recordKey="session-1"
        matches={MATCHES}
      />,
    );

    fireEvent.click(screen.getByRole('button'));
    const currentPick = document.querySelector('[data-sign="match-crm-1"]');
    expect(currentPick).toHaveAttribute('data-selected', 'true');
    fireEvent.click(currentPick);

    expect(selection.getSelectedEntityId('call', 'session-1')).toBeUndefined();
  });

  test('shows the count without a picker when selection is unsupported', () => {
    const { container } = render(
      <MatchedContactsTag
        scope="conversation"
        recordKey="conversation-1"
        matches={MATCHES}
        selectable={false}
      />,
    );

    expect(container.querySelector('[data-sign="matchCounts"]')).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('shows the count without a picker when the record has no key', () => {
    const { container } = render(
      <MatchedContactsTag scope="call" matches={MATCHES} />,
    );

    expect(container.querySelector('[data-sign="matchCounts"]')).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('ConversationMatchedContactsTag', () => {
  const singleCorrespondent = {
    conversationId: 'conversation-1',
    correspondents: [{ phoneNumber: '+16505550100' }],
    correspondentMatchesList: [MATCHES],
  };

  test('lets the user pick for a single-correspondent text conversation', () => {
    render(
      <ConversationMatchedContactsTag conversation={singleCorrespondent} />,
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('J. Smith'));

    expect(
      selection.getSelectedEntityId('conversation', 'conversation-1'),
    ).toBe('crm-2');
  });

  test('keeps group threads display-only and ignores per-correspondent matches', () => {
    const { container } = render(
      <ConversationMatchedContactsTag
        conversation={{
          conversationId: 'conversation-2',
          correspondents: [
            { phoneNumber: '+16505550100' },
            { phoneNumber: '+16505550101' },
          ],
          correspondentMatchesList: [MATCHES, MATCHES],
        }}
      />,
    );

    // getDisplayedSelectedEntity is called once per correspondent with the same
    // conversation id, so one pick would rename every correspondent.
    expect(container).toBeEmptyDOMElement();
  });
});

describe('useCallDisplayNameWithMatches', () => {
  test('picks against the call session', () => {
    const Host = () => {
      const DisplayName = useCallDisplayNameWithMatches(
        () => <span>name</span>,
        'session-1',
        MATCHES,
      );
      return <DisplayName displayControl={{ maybe: true }} />;
    };

    render(<Host />);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('J. Smith'));

    expect(selection.getSelectedEntityId('call', 'session-1')).toBe('crm-2');
  });

  test('hides the picker when a logged activity identifies the contact', () => {
    const Host = () => {
      const DisplayName = useCallDisplayNameWithMatches(
        () => <span>name</span>,
        'session-1',
        MATCHES,
        [{ contact: { id: 'crm-2' }, type: 'activity' }],
      );
      return <DisplayName displayControl={{ maybe: true }} />;
    };

    const { container } = render(<Host />);

    expect(container.querySelector('[data-sign="matchCounts"]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('useConversationDisplayNameWithMatches', () => {
  const conversation = {
    conversationId: 'conversation-1',
    correspondents: [{ phoneNumber: '+16505550100' }],
    correspondentMatchesList: [MATCHES],
  };

  const BaseDisplayName = ({ displayControl }) => (
    <span data-sign="baseDisplayName">
      {`maybe:${Boolean(displayControl?.maybe)}`}
      {` counts:${Boolean(displayControl?.matchCounts)}`}
    </span>
  );

  const Host = ({ base = BaseDisplayName, displayControl }) => {
    const DisplayName = useConversationDisplayNameWithMatches(
      base,
      conversation,
    );
    return <DisplayName displayControl={displayControl} />;
  };

  test('suppresses the inert framework count and adds the picker', () => {
    render(<Host displayControl={{ maybe: true, matchCounts: true }} />);

    expect(screen.getByText(/maybe:true/)).toHaveTextContent('counts:false');
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('J. Smith'));

    expect(
      selection.getSelectedEntityId('conversation', 'conversation-1'),
    ).toBe('crm-2');
  });

  test('hides the picker when a conversation log identifies the contact', () => {
    const loggedConversation = {
      ...conversation,
      conversationMatches: [
        { contactId: 'crm-2', id: 'activity-1', type: 'activity' },
      ],
    };
    const Host = () => {
      const DisplayName = useConversationDisplayNameWithMatches(
        BaseDisplayName,
        loggedConversation,
      );
      return <DisplayName displayControl={{ maybe: true }} />;
    };

    const { container } = render(<Host />);

    expect(container.querySelector('[data-sign="matchCounts"]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('hides the picker for a contact resolved from an earlier log', () => {
    const loggedConversation = {
      ...conversation,
      lastMatchedCorrespondentEntity: MATCHES[2],
    };
    const Host = () => {
      const DisplayName = useConversationDisplayNameWithMatches(
        BaseDisplayName,
        loggedConversation,
      );
      return <DisplayName displayControl={{ maybe: true }} />;
    };

    const { container } = render(<Host />);

    expect(container.querySelector('[data-sign="matchCounts"]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('keeps a stable component identity so an open menu survives re-renders', () => {
    const { rerender } = render(<Host />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('J. Smith')).toBeInTheDocument();

    // The framework rebuilds its DisplayName on every render; a new element
    // type here would remount the picker and close the menu mid-interaction.
    rerender(<Host base={(props) => <BaseDisplayName {...props} />} />);

    expect(screen.getByText('J. Smith')).toBeInTheDocument();
  });
});
