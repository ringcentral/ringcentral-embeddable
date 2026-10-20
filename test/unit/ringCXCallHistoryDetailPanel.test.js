import { render, screen, within } from '@testing-library/react';
import React from 'react';

import { CallHistoryDetailPanel } from '../../src/ringcx/components/CallHistoryDetailPanel/CallHistoryDetailPanel';

jest.mock('@ringcentral-integration/micro-auth/src/app/components', () => ({
  useFormattedPhoneNumber: (phoneNumber) => phoneNumber,
}));
jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppFooterNav: () => null,
  AppHeaderNav: () => null,
}));
jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  ActionMenuList: () => null,
  PageHeader: () => null,
  PageHeaderBackButton: () => null,
}));
jest.mock(
  '@ringcentral-integration/micro-contacts/src/app/components/ContactAvatar',
  () => ({ ContactAvatar: () => null }),
);
jest.mock('@ringcentral-integration/micro-message/src/app/components', () => ({
  VoicemailPlayer: () => null,
}));
jest.mock('../../src/ringcx/hooks/useCxCallContactRenderInfo', () => ({
  useCxCallContactRenderInfo: () => ({
    renderInfo: {},
    DisplayName: () => null,
  }),
}));
// The shared mock's `Block` passes `borderRadius` on to the DOM.
jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('@ringcentral/spring-ui'),
  Block: ({ children, borderRadius, ...props }) => (
    <section {...props}>{children}</section>
  ),
}));

function renderPanel(callMeta) {
  render(
    <CallHistoryDetailPanel
      callDetail={{
        to: { phoneNumber: '+16508447090' },
        from: { phoneNumber: '+16504366339' },
        startTime: Date.now(),
      }}
      callMeta={{ durationMs: 13000, ...callMeta }}
      isInbound={false}
      isActiveCall={false}
      isLoading={false}
      callNotFound={false}
      canDial={false}
      isDialDisabled={false}
      pastLead={null}
      showLeadHistory={false}
      onBack={jest.fn()}
      onDial={jest.fn()}
      onCopyNumber={jest.fn()}
      onCopyCallId={jest.fn()}
      loadRecording={jest.fn()}
      loadLeadHistory={jest.fn()}
    />,
  );
  return screen.getByTestId('sourceBlock');
}

describe('CallHistoryDetailPanel source card', () => {
  test('gives a lone From value the whole width', () => {
    // A lead call's campaign is both its From and its source, so the source
    // is not repeated.
    const card = renderPanel({ campaignName: 'Embbnux preview campaign' });

    expect(within(card).getByTestId('toFromField')).toHaveTextContent(
      'Embbnux preview campaign',
    );
    expect(within(card).queryByTestId('sourceField')).toBeNull();
    expect(card.firstChild).toHaveClass('grid-cols-1');
    expect(card.firstChild).not.toHaveClass('grid-cols-2');
  });

  test('splits the card when the source differs from From', () => {
    const card = renderPanel({ outboundType: 'MANUAL', queueName: 'PSR' });

    expect(within(card).getByTestId('toFromField')).toBeInTheDocument();
    expect(within(card).getByTestId('sourceField')).toHaveTextContent('PSR');
    expect(card.firstChild).toHaveClass('grid-cols-2');
  });
});
