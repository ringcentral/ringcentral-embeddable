// The participants page of a RingCX warm transfer. It is a page of the call,
// so like the call page it shows a back header and hides the main tab bar.

jest.mock('@ringcentral-integration/next-core', () => ({
  ...jest.requireActual('../mocks/nextCoreMock'),
  useParams: () => ({ id: 'uii-1$session-1' }),
}));
// The footer slot hides the main tab bar when a page fills it, even with
// nothing; the mock marks what the page put there.
jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  AppHeaderNav: ({ children }) => <div data-sign="appHeaderNav">{children}</div>,
  AppFooterNav: ({ children }) => <div data-sign="appFooterNav">{children}</div>,
}));
jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  PageHeader: ({ children, onBackClick }) => (
    <button type="button" data-sign="backButton" onClick={onBackClick}>
      {children}
    </button>
  ),
}));
jest.mock('../../src/ringcx/lib/FormatPhoneNumber', () => ({
  formatPhoneNumber: ({ phoneNumber }) => phoneNumber,
}));
[
  'CxActiveCallControl',
  'CxAgentSession',
  'CxAuth',
  'CxCall',
  'CxCallMonitor',
  'CxIntegratedSoftphone',
].forEach((name) => {
  jest.doMock(`../../src/ringcx/services/${name}`, () => ({
    [name]: class {},
  }));
});

import React from 'react';
import { render } from '@testing-library/react';

const {
  CxActiveCallListView,
} = require('../../src/ringcx/views/CxActiveCallListView/CxActiveCallListView.view');

const CONFERENCE = [
  { session: { sessionId: 'main', phone: '+16579991394' } },
  { session: { sessionId: 'own' }, agentName: 'Agent' },
  {
    session: {
      sessionId: 'leg-3',
      transferSessions: { 'leg-3': { destination: '+16508446685' } },
    },
  },
];

const byDataSign = (dataSign) =>
  document.querySelector(`[data-sign="${dataSign}"]`);

function renderPage(callList) {
  const view = Object.create(CxActiveCallListView.prototype);
  view.getUIProps = () => ({
    callList,
    isOnMute: false,
    showMuteButton: false,
    userName: 'Agent',
    isInbound: true,
  });
  view.getUIFunctions = () => ({ goBack: jest.fn() });
  const Page = () => view.component();
  render(<Page />);
}

describe('CxActiveCallListView page chrome', () => {
  test.each([
    ['the participants', CONFERENCE],
    ['no participants once the transfer is gone', CONFERENCE.slice(0, 1)],
  ])('hides the main tab bar while showing %s', (_name, callList) => {
    renderPage(callList);

    expect(byDataSign('backButton')).not.toBeNull();
    const footer = byDataSign('appFooterNav');
    expect(footer).not.toBeNull();
    expect(footer).toBeEmptyDOMElement();
  });
});
