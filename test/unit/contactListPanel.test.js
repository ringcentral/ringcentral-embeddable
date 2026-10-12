import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('@ringcentral/spring-ui'),
  VirtualizedList: ({ data }) => (
    <ul data-sign="contactItems">
      {data.map((contact) => (
        <li key={contact.id}>{contact.name}</li>
      ))}
    </ul>
  ),
}));

jest.mock('@ringcentral-integration/react-hooks', () => ({
  useVirtuosoScrollPosition: () => ({
    virtuosoActionsRef: { current: null },
    scrollerRef: { current: null },
  }),
}));

jest.mock('@ringcentral-integration/micro-message/src/app/components', () => ({
  SearchInputToggle: () => null,
}));

jest.mock('../../src/app/components/ContactListItem', () => ({
  ContactListItem: () => null,
}));

import { ContactListPanel } from '../../src/app/views/ContactListView/ContactListPanel';

function renderPanel(props = {}) {
  return render(
    <ContactListPanel
      contacts={[]}
      searchSource="all"
      searchString=""
      isSearching={false}
      showSpinner={false}
      onItemSelect={jest.fn()}
      onSearchContact={jest.fn()}
      setLastPosition={jest.fn()}
      {...props}
    />,
  );
}

describe('ContactListPanel loading state', () => {
  test('shows the spinner instead of the empty state while filtering', () => {
    renderPanel({ isSearching: true });

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.queryByText('noRecords')).toBeNull();
  });

  test('shows the empty state once filtering found no contacts', () => {
    renderPanel({ isSearching: false });

    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('noRecords')).toBeTruthy();
  });

  test('keeps the current contacts shown while filtering', () => {
    renderPanel({
      isSearching: true,
      contacts: [{ id: 'contact-1', name: 'Ann Lee' }],
    });

    expect(screen.getByText('Ann Lee')).toBeTruthy();
  });
});
