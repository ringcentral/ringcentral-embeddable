import { act, fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';

import { LeadInfoPanel } from '../../src/ringcx/components/LeadInfoPanel/LeadInfoPanel';

jest.mock(
  '@ringcentral-integration/micro-contacts/src/app/components/ContactAvatar',
  () => ({
    ContactAvatar: () => <span data-sign="leadAvatar" />,
  }),
);

jest.mock('@ringcentral-integration/micro-core/src/app/components', () => ({
  CopyIconButtonSpring: ({ text }) => (
    <button type="button" data-sign="copyNumber" data-text={text} />
  ),
}));

jest.mock('@ringcentral-integration/micro-message/src/app/components', () => ({
  VoicemailPlayer: ({ uri, onStartLoad, audioStatus }) => (
    <button
      type="button"
      data-sign="leadRecordingPlayer"
      data-uri={uri}
      data-source={audioStatus?.blobUrl ?? ''}
      onClick={() => onStartLoad(uri)}
    />
  ),
}));

jest.mock('@ringcentral-integration/next-widgets/components', () => ({
  ActionMenuList: ({ buttons }) => (
    <div data-sign="leadActions">
      {buttons.map(({ actionType, color, disabled, label, onClick }) => (
        <button
          key={actionType}
          type="button"
          data-sign={actionType}
          data-color={color}
          disabled={disabled}
          onClick={onClick}
        >
          {label}
        </button>
      ))}
    </div>
  ),
  PageHeaderBackButton: ({ onClick, 'data-sign': dataSign }) => (
    <button type="button" data-sign={dataSign} onClick={onClick} />
  ),
}));

jest.mock('../../src/ringcx/components/ManualPassForm', () => ({
  // Shown in place of the panel's content while the agent passes the lead.
  ManualPassForm: ({ campaignId, onSubmit }) => (
    <button
      type="button"
      data-sign="manualPassSubmit"
      data-campaign={campaignId}
      onClick={() =>
        onSubmit({
          dispositionId: 'disposition-1',
          notes: '',
          callback: false,
          callbackDTS: '',
        })
      }
    />
  ),
}));

// The shared mock's `Block` passes `borderRadius` on to the DOM, and its
// `Button` drops the tooltip.
jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('@ringcentral/spring-ui'),
  Block: ({ children, borderRadius, ...props }) => (
    <section {...props}>{children}</section>
  ),
  Button: ({ children, TooltipProps, variant, size, ...props }) => (
    <button type="button" data-tooltip={TooltipProps?.title} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../../src/ringcx/lib/FormatPhoneNumber', () => ({
  formatPhoneNumber: ({ phoneNumber }) => `formatted ${phoneNumber}`,
}));

const RECORDING_URL =
  'https://exs.ringcentral.com/cx/interactions/assets/v1/accounts/1/sub-accounts/2/dialogs/d-1/segments/s-1/type/AudioStereo';

function createInfo(overrides = {}) {
  return {
    target: { type: 'lead', requestId: 'request-1' },
    lead: { leadId: '5725', campaignId: '1' },
    name: 'Embbnux Labs',
    phoneNumbers: ['+16508446685'],
    source: 'Spring campaign',
    rows: [
      {
        id: 'source',
        group: 'status',
        wide: true,
        labelKey: 'source',
        value: 'Spring campaign',
        isRecording: false,
      },
      {
        id: 'leadState',
        group: 'status',
        wide: false,
        labelKey: 'leadState',
        value: 'PENDING',
        isRecording: false,
      },
      {
        id: 'leadId',
        group: 'ids',
        wide: false,
        labelKey: 'leadId',
        value: '5725',
        isRecording: false,
      },
      {
        id: 'extraData-Notes',
        group: 'extra',
        wide: false,
        label: 'Notes',
        value: '',
        isRecording: false,
      },
    ],
    ...overrides,
  };
}

function createPreviewActions(overrides = {}) {
  return {
    dialNumbers: ['+16508446685'],
    isDialDisabled: false,
    onDial: jest.fn(),
    showManualPass: true,
    isManualPassDisabled: false,
    onManualPass: jest.fn(async () => undefined),
    fetchDispositionList: jest.fn(async () => []),
    defaultTimezone: 'America/New_York',
    ...overrides,
  };
}

function renderPanel(props = {}) {
  const panelProps = {
    info: createInfo(),
    showViewLeadButton: true,
    onViewLead: jest.fn(),
    previewActions: createPreviewActions(),
    loadRecording: jest.fn(async () => 'blob:recording'),
    showCloseButton: false,
    onClose: jest.fn(),
    ...props,
  };
  render(<LeadInfoPanel {...panelProps} />);
  return panelProps;
}

const bySign = (sign) => document.querySelector(`[data-sign="${sign}"]`);
const allBySign = (sign) => [
  ...document.querySelectorAll(`[data-sign="${sign}"]`),
];

describe('LeadInfoPanel', () => {
  test('shows the lead in a header, then one card per group', () => {
    renderPanel();

    expect(within(bySign('leadInfoHeader')).getByText('Embbnux Labs')).toBeTruthy();
    expect(bySign('leadPhoneNumber')).toHaveTextContent('formatted +16508446685');
    expect(bySign('copyNumber')).toHaveAttribute(
      'data-text',
      'formatted +16508446685',
    );
    expect(
      [...document.querySelectorAll('[data-sign^="leadCard-"]')].map((card) =>
        card.getAttribute('data-sign'),
      ),
    ).toEqual(['leadCard-status', 'leadCard-ids', 'leadCard-extra']);
    expect(bySign('leadField-source')).toHaveClass('col-span-2');
    expect(bySign('leadField-source')).toHaveTextContent('sourceSpring campaign');
    // An extra data field the lead left empty still shows.
    expect(bySign('leadField-extraData-Notes')).toHaveTextContent('Notes-');
  });

  test('falls back to unknown for a lead without a name', () => {
    renderPanel({ info: createInfo({ name: '' }) });

    expect(bySign('leadName')).toHaveTextContent('unknown');
  });

  test('shows a back button only without a tab bar', () => {
    const { onClose } = renderPanel({ showCloseButton: true });

    fireEvent.click(bySign('leadInfoClose'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('has no back button under a tab bar', () => {
    renderPanel();

    expect(bySign('leadInfoClose')).toBeNull();
  });

  test('dials a fetched lead from its number', () => {
    const { previewActions } = renderPanel();

    fireEvent.click(bySign('leadPhoneNumberButton'));

    expect(previewActions.onDial).toHaveBeenCalledWith('+16508446685');
    expect(bySign('leadPhoneNumberButton')).toHaveTextContent(
      'formatted +16508446685',
    );
    expect(bySign('leadPhoneNumberButton')).toHaveAttribute(
      'data-tooltip',
      'callNumber',
    );
  });

  test('passes and views a fetched lead from the header actions', async () => {
    const { onViewLead, previewActions } = renderPanel();

    // The numbers dial, so the actions are manual pass and view lead.
    expect(bySign('leadActions').querySelectorAll('button')).toHaveLength(2);
    expect(bySign('manualPass')).toHaveAttribute('data-color', 'danger');
    fireEvent.click(bySign('manualPass'));
    expect(bySign('manualPassSubmit')).toHaveAttribute('data-campaign', '1');
    await act(async () => {
      fireEvent.click(bySign('manualPassSubmit'));
    });
    expect(previewActions.onManualPass).toHaveBeenCalledWith(
      expect.objectContaining({ dispositionId: 'disposition-1' }),
    );
    expect(bySign('manualPassSubmit')).toBeNull();

    fireEvent.click(bySign('viewLead'));
    expect(onViewLead).toHaveBeenCalledWith({ leadId: '5725', campaignId: '1' });
  });

  test('lists each number of a multi-number lead, each dialing itself', () => {
    const numbers = ['+16508446685', '+16505550100'];
    const { previewActions } = renderPanel({
      info: createInfo({ phoneNumbers: numbers }),
      previewActions: createPreviewActions({ dialNumbers: numbers }),
    });
    const buttons = allBySign('leadPhoneNumberButton');

    expect(buttons.map((button) => button.textContent)).toEqual([
      'formatted +16508446685',
      'formatted +16505550100',
    ]);
    fireEvent.click(buttons[1]);
    expect(previewActions.onDial).toHaveBeenCalledWith('+16505550100');
  });

  test('disables what the Leads list would disable', () => {
    renderPanel({
      previewActions: createPreviewActions({
        isDialDisabled: true,
        isManualPassDisabled: true,
      }),
    });

    expect(bySign('leadPhoneNumberButton')).toBeDisabled();
    expect(bySign('manualPass')).toBeDisabled();
  });

  test('shows the numbers as text when the lead cannot be dialed from here', () => {
    renderPanel({ previewActions: createPreviewActions({ dialNumbers: [] }) });

    expect(bySign('leadPhoneNumberButton')).toBeNull();
    expect(bySign('leadPhoneNumber')).toHaveTextContent('formatted +16508446685');
  });

  test("offers only the host lead viewer for a call's lead", () => {
    renderPanel({ previewActions: null });

    expect(bySign('leadPhoneNumberButton')).toBeNull();
    expect(
      [...bySign('leadActions').querySelectorAll('button')].map((button) =>
        button.getAttribute('data-sign'),
      ),
    ).toEqual(['viewLead']);
  });

  test('leaves the actions out when there are none', () => {
    renderPanel({ previewActions: null, showViewLeadButton: false });

    expect(bySign('leadActions')).toBeNull();
  });

  test('says when the lead is gone', () => {
    renderPanel({ info: null });

    expect(screen.getByText('leadNotAvailable')).toBeTruthy();
  });

  describe('recordings', () => {
    const recordingInfo = createInfo({
      rows: [
        {
          id: 'extraData-Message',
          group: 'extra',
          wide: true,
          label: 'Message',
          value: RECORDING_URL,
          isRecording: true,
        },
      ],
    });

    test('loads the recording once the agent presses play', async () => {
      const { loadRecording } = renderPanel({ info: recordingInfo });

      expect(loadRecording).not.toHaveBeenCalled();
      await act(async () => {
        fireEvent.click(bySign('leadRecordingPlayer'));
      });

      expect(loadRecording).toHaveBeenCalledWith(RECORDING_URL);
      expect(bySign('leadRecordingPlayer')).toHaveAttribute(
        'data-source',
        'blob:recording',
      );
      expect(bySign('leadRecordingError')).toBeNull();
    });

    test('says when the recording cannot load', async () => {
      renderPanel({
        info: recordingInfo,
        loadRecording: jest.fn(async () => {
          throw new Error('Recording access is not available');
        }),
      });

      await act(async () => {
        fireEvent.click(bySign('leadRecordingPlayer'));
      });

      expect(bySign('leadRecordingError')).toHaveTextContent(
        'recordingUnavailable',
      );
    });
  });
});
