import React from 'react';
import { render, screen } from '@testing-library/react';

import { HistoryActiveCallsView } from '../src/app/views/CallHistoryView/HistoryActiveCalls.view';

let mockSelectedEntityId = 'contact-1';

const mockMatchedContactSelection = {
  resolveSelection: jest.fn((_scope, _key, matches) => {
    const displayedSelection = matches?.find(
      ({ id }) => id === mockSelectedEntityId,
    );
    return displayedSelection
      ? { displayedSelection, selections: matches }
      : undefined;
  }),
};

const mockUseCallDisplayNameWithMatches = jest.fn(
  (BaseDisplayName) => BaseDisplayName,
);

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({ t: (key) => key }),
}));

jest.mock('@ringcentral-integration/micro-phone/src/app/hooks', () => ({
  useCallActionButtons: () => [],
  useContactRenderInfoFromCall: (call) => ({
    Avatar: () => <span data-sign="avatar" />,
    CallStatus: ({ children }) => <span>{children}</span>,
    DisplayName: ({ displayControl }) => {
      const name =
        call.callSelectionInfo?.displayedSelection?.name ?? 'Unmatched';
      return displayControl?.viewable ? <a href="#contact">{name}</a> : name;
    },
    OnOtherDevice: null,
    duration: '00:42',
  }),
}));

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/ActiveCallsViewSpring',
  () => ({ ActiveCallsView: class ActiveCallsView {} }),
);

jest.mock(
  '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring',
  () => ({ CallControlView: class CallControlView {} }),
);

jest.mock('@ringcentral-integration/next-core', () => ({
  injectable: () => (target) => target,
  RcViewModule: class RcViewModule {},
  useConnector: (selector) => selector(),
  useContainer: () => mockMatchedContactSelection,
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  ActionMenuList: () => <span data-sign="actions" />,
}));

jest.mock('@ringcentral/spring-ui', () => ({
  List: ({ children }) => <ul>{children}</ul>,
  ListItem: ({ children, divider, onClick }) => (
    <li
      data-divider={String(divider)}
      data-sign="active-call-item"
      onClick={onClick}
    >
      {children}
    </li>
  ),
  ListItemText: ({ primary, secondary }) => (
    <div>
      {primary}
      {secondary}
    </div>
  ),
}));

jest.mock('../src/app/components/MatchedContactsTag', () => ({
  useCallDisplayNameWithMatches: (...args) =>
    mockUseCallDisplayNameWithMatches(...args),
}));

function createCall(id, matches) {
  return {
    id: `call-${id}`,
    direction: 'Inbound',
    fromMatches: matches,
    sessionId: `session-${id}`,
    telephonySessionId: `telephony-${id}`,
  };
}

function createView(calls) {
  const activeCallsView = {
    getUIFunctions: () => ({
      useActionsHandler: () => jest.fn(async () => {}),
    }),
    getUIProps: () => ({ calls }),
    useActiveCallItemActions: () => [{ type: 'hangUp' }],
  };
  const callControlView = {
    useCallActions: () => [{ type: 'hangUp' }],
  };
  return new HistoryActiveCallsView(activeCallsView, callControlView);
}

describe('HistoryActiveCallsView', () => {
  beforeEach(() => {
    mockSelectedEntityId = 'contact-1';
    mockMatchedContactSelection.resolveSelection.mockClear();
    mockUseCallDisplayNameWithMatches.mockClear();
  });

  test('updates the plain-text name when the selected contact changes', () => {
    const matches = [
      { id: 'contact-1', name: 'First contact' },
      { id: 'contact-2', name: 'Second contact' },
    ];
    const view = createView([createCall('1', matches)]);
    const Component = view.component.bind(view);
    const { rerender } = render(<Component />);

    expect(screen.getByText('First contact')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    mockSelectedEntityId = 'contact-2';
    rerender(<Component />);

    expect(screen.getByText('Second contact')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(mockMatchedContactSelection.resolveSelection).toHaveBeenCalledWith(
      'call',
      'session-1',
      matches,
    );
  });

  test('uses the compact label and removes the final item divider', () => {
    const matches = [{ id: 'contact-1', name: 'First contact' }];
    const view = createView([
      createCall('1', matches),
      createCall('2', matches),
    ]);
    const Component = view.component.bind(view);

    render(<Component />);

    expect(screen.getByText('activeCalls')).toHaveClass(
      'typography-subtitleMiniSemiBold',
    );
    const items = screen.getAllByTestId('active-call-item');
    expect(items[0]).toHaveAttribute('data-divider', 'true');
    expect(items[1]).toHaveAttribute('data-divider', 'false');
  });
});
