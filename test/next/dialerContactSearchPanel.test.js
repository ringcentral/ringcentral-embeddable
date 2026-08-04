import React from 'react';
import { act, render } from '@testing-library/react';

const mockDialerContactSearchPanel = jest.fn(() => null);

jest.mock('@ringcentral-integration/micro-core/src/app/hooks', () => ({
  useLocale: () => ({
    t: (key) =>
      ({
        extension: 'Extension',
        mobile: 'Mobile',
      }[key] || key),
  }),
}));

jest.mock(
  '@ringcentral-integration/micro-contacts/src/app/views/ContactSearchView/ContactSearchPanel/DialerContactSearchPanel',
  () => ({
    DialerContactSearchPanel: (props) => mockDialerContactSearchPanel(props),
  }),
);

import { DialerContactSearchPanel } from '../../next/app/views/ContactSearchView/DialerContactSearchPanel';

function createProps(overrides = {}) {
  return {
    defaultTab: 'thirdParty',
    thirdPartySourceName: 'CRM',
    thirdPartyContacts: [],
    companyContacts: [],
    personalContacts: [],
    otherContacts: [],
    ...overrides,
  };
}

describe('DialerContactSearchPanel third-party tab', () => {
  beforeEach(() => {
    mockDialerContactSearchPanel.mockClear();
  });

  test('hides the third-party tab and falls back to company without results', () => {
    render(<DialerContactSearchPanel {...createProps()} />);

    expect(mockDialerContactSearchPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultTab: 'company',
        thirdPartySourceName: undefined,
      }),
    );
  });

  test('shows third-party results in the first default tab', () => {
    const thirdPartyContacts = [
      { id: 'contact-1', isPrimary: true, phoneType: 'mobile' },
    ];

    render(
      <DialerContactSearchPanel {...createProps({ thirdPartyContacts })} />,
    );

    expect(mockDialerContactSearchPanel).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultTab: 'thirdParty',
        thirdPartySourceName: 'CRM',
        thirdPartyContacts: [
          expect.objectContaining({
            phoneType: 'Mobile',
            originalPhoneType: 'mobile',
          }),
        ],
      }),
    );
  });

  test('removes horizontal result gutters and restores the selected phone type', async () => {
    const onSelect = jest.fn();
    const companyContacts = [
      { id: 'contact-1', isPrimary: true, phoneType: 'extension' },
    ];
    const { container } = render(
      <DialerContactSearchPanel
        {...createProps({ companyContacts, onSelect })}
      />,
    );
    const panelProps = mockDialerContactSearchPanel.mock.lastCall[0];

    expect(container.firstChild).toHaveClass(
      '[&_.sui-suggestion-list-root]:px-0',
      '[&_.sui-list-item-root]:px-0',
    );
    expect(panelProps.companyContacts).toEqual([
      expect.objectContaining({
        phoneType: 'Extension',
        originalPhoneType: 'extension',
      }),
    ]);

    await act(async () => {
      await panelProps.onSelect(panelProps.companyContacts);
    });

    expect(onSelect).toHaveBeenCalledWith([
      expect.objectContaining({ phoneType: 'extension' }),
    ]);
    expect(onSelect.mock.calls[0][0][0]).not.toHaveProperty(
      'originalPhoneType',
    );
  });
});
