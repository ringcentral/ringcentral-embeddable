import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-spring-page';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { WrapUpPanel } from '../../src/ringcx/views/CxDispositionView/WrapUpPanel';

// The shared mock passes the pill tab props on to the DOM.
jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('@ringcentral/spring-ui'),
  Tabs: ({ children, variant, pill, size, ...props }) => (
    <div {...props}>{children}</div>
  ),
}));

jest.mock('../../src/ringcx/components/CallInfoHeader', () => ({
  CallInfoHeader: ({ actions }) => <header data-sign="callInfoHeader">{actions}</header>,
}));

jest.mock('../../src/ringcx/components/DispositionForm', () => ({
  DispositionForm: ({ dispositionData }) => (
    <div data-sign="dispositionForm">{dispositionData?.notes}</div>
  ),
}));

jest.mock('../../src/ringcx/views/CxDispositionView/i18n', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../src/app/views/LogCallView/i18n', () => ({
  __esModule: true,
  default: {},
}));

const CALL_ID = 'uii-1$session-1';
const DISPOSITIONS = [{ dispositionId: 'disp-1', disposition: 'Finished' }];

function logPage({ required = [], formData = { contact: 'contact-1', note: '' } } = {}) {
  return {
    id: '$LOG-CALL',
    title: 'Log to TestService',
    schema: {
      type: 'object',
      required,
      properties: { contact: { type: 'string' }, note: { type: 'string' } },
    },
    uiSchema: { submitButtonOptions: { submitText: 'Save to TestService' } },
    formData,
  };
}

function wrapUp(overrides = {}) {
  return {
    logMode: 'prepare',
    entry: { hasDispositionStep: true, formStatus: 'ready', logStatus: 'pending' },
    hostName: 'TestService',
    logCallPage: logPage(),
    logCall: null,
    logButtonTitle: null,
    logCallPageOwnerId: CALL_ID,
    wrapUpStartTime: Date.now(),
    ...overrides,
  };
}

function props(overrides = {}) {
  return {
    callId: CALL_ID,
    basicInfo: null,
    isInbound: false,
    callEnded: true,
    showSubmitStep: true,
    isDisposed: false,
    saveStatus: 'submit',
    submitEndsCall: false,
    submitBlockedByVoicemailDrop: false,
    dispositionPickList: DISPOSITIONS,
    dispositionData: { dispositionId: 'disp-1', notes: '', summary: '' },
    validated: { dispositionId: true, notes: true },
    required: { notes: false },
    hideCallNote: false,
    showSummary: false,
    summary: '',
    isSummaryFinal: false,
    isSummaryLoading: false,
    isSummaryEdited: false,
    wrapUp: wrapUp(),
    onUpdateCallLog: jest.fn(),
    onUpdateSummary: jest.fn(),
    onSubmit: jest.fn(),
    onLogLater: jest.fn(),
    onPrepareLogForm: jest.fn(),
    onLoadLogCall: jest.fn(),
    onLogFormChange: jest.fn(),
    onLogFormButtonClick: jest.fn(),
    ...overrides,
  };
}

function activeTab(container) {
  return container.querySelector('[data-tab-value]')?.getAttribute('data-tab-value');
}

const submitButton = () => document.querySelector('[data-sign="submitButton"]');

beforeEach(() => {
  JSONSchemaPage.mockClear();
});

describe('WrapUpPanel layout', () => {
  test('opens on Disposition while the disposition is to be submitted', () => {
    const { container } = render(<WrapUpPanel {...props()} />);

    expect(activeTab(container)).toBe('disposition');
    expect(screen.getByText('TestService')).toBeTruthy();
    expect(submitButton().textContent).toBe('submit');
    // No hint under Submit.
    expect(container.querySelector('[data-sign="wrapUpHint"]')).toBeNull();
  });

  test("opens on the host's tab once the disposition is saved", () => {
    const { container } = render(<WrapUpPanel {...props({ isDisposed: true })} />);

    expect(activeTab(container)).toBe('log');
    expect(container.querySelector('[data-sign="dispositionRecap"]')).toBeTruthy();
    // Only the call log is left: the host's own save button.
    expect(submitButton().textContent).toBe('Save to TestService');
  });

  test('shows a call log without a disposition step without tabs', () => {
    const { container } = render(
      <WrapUpPanel
        {...props({
          showSubmitStep: false,
          wrapUp: wrapUp({
            entry: { hasDispositionStep: false, formStatus: 'ready', logStatus: 'pending' },
          }),
        })}
      />,
    );

    expect(activeTab(container)).toBeUndefined();
    expect(container.querySelector('[data-sign="dispositionForm"]')).toBeNull();
    expect(container.querySelector('[data-sign="wrapUpCallLog"]')).toBeTruthy();
    expect(submitButton().textContent).toBe('Save to TestService');
  });

  test('reads Save for a log form without its own submit text', () => {
    const page = logPage();
    delete page.uiSchema;
    render(
      <WrapUpPanel
        {...props({ isDisposed: true, wrapUp: wrapUp({ logCallPage: page }) })}
      />,
    );

    expect(submitButton().textContent).toBe('save');
  });

  test('shows only the disposition for a host without a log form', () => {
    const { container } = render(
      <WrapUpPanel {...props({ wrapUp: wrapUp({ logMode: 'none', entry: null }) })} />,
    );

    expect(activeTab(container)).toBeUndefined();
    expect(container.querySelector('[data-sign="wrapUpLog"]')).toBeNull();
    expect(container.querySelector('[data-sign="dispositionForm"]')).toBeTruthy();
  });

  test('shows the call log form during the call, with no timer', () => {
    const { container } = render(<WrapUpPanel {...props({ callEnded: false })} />);

    expect(container.querySelector('[data-sign="wrapUpCallLog"]')).toBeTruthy();
    expect(container.querySelector('[data-sign="wrapUpTimer"]')).toBeNull();
  });

  test('shows the wrap-up time until the disposition is saved', () => {
    const { container, rerender } = render(<WrapUpPanel {...props()} />);
    expect(container.querySelector('[data-sign="wrapUpTimer"]')).toBeTruthy();

    rerender(<WrapUpPanel {...props({ isDisposed: true })} />);
    expect(container.querySelector('[data-sign="wrapUpTimer"]')).toBeNull();
  });
});

describe("WrapUpPanel host's form", () => {
  test('asks for the form as the page opens, during the call too', () => {
    const onPrepareLogForm = jest.fn();
    render(
      <WrapUpPanel
        {...props({
          callEnded: false,
          onPrepareLogForm,
          wrapUp: wrapUp({
            entry: { hasDispositionStep: true, formStatus: 'idle', logStatus: 'pending' },
          }),
        })}
      />,
    );

    expect(onPrepareLogForm).toHaveBeenCalledWith(CALL_ID);
    expect(document.querySelector('[data-sign="wrapUpLogFormLoading"]')).toBeTruthy();
  });

  test("asks again once another call's form replaced it", () => {
    const onPrepareLogForm = jest.fn();
    render(
      <WrapUpPanel
        {...props({ onPrepareLogForm, wrapUp: wrapUp({ logCallPageOwnerId: 'other' }) })}
      />,
    );

    expect(onPrepareLogForm).toHaveBeenCalledWith(CALL_ID);
  });

  test('does not ask again for its own form', () => {
    const onPrepareLogForm = jest.fn();
    render(<WrapUpPanel {...props({ onPrepareLogForm })} />);

    expect(onPrepareLogForm).not.toHaveBeenCalled();
  });

  test("shows the host's reason when it has no form", () => {
    render(
      <WrapUpPanel
        {...props({
          wrapUp: wrapUp({
            entry: {
              hasDispositionStep: true,
              formStatus: 'none',
              noLogFormReason: 'No contact found',
              logStatus: 'pending',
            },
          }),
        })}
      />,
    );

    expect(screen.getByText('No contact found')).toBeTruthy();
    expect(JSONSchemaPage).not.toHaveBeenCalled();
  });

  test('closes a call log page with no form', () => {
    const onLogLater = jest.fn();
    render(
      <WrapUpPanel
        {...props({
          showSubmitStep: false,
          onLogLater,
          wrapUp: wrapUp({
            entry: { hasDispositionStep: false, formStatus: 'none', logStatus: 'pending' },
          }),
        })}
      />,
    );

    fireEvent.click(document.querySelector('[data-sign="wrapUpClose"]'));
    expect(onLogLater).toHaveBeenCalled();
  });

  test('builds the default form from the call for a showLogModal host', () => {
    const onLoadLogCall = jest.fn();
    render(
      <WrapUpPanel
        {...props({
          onLoadLogCall,
          wrapUp: wrapUp({
            logMode: 'page',
            logCallPage: undefined,
            logCall: {
              direction: 'Outbound',
              toMatches: [],
              fromMatches: [],
              ringcx: { notes: 'RingCX notes' },
            },
          }),
        })}
      />,
    );

    expect(onLoadLogCall).toHaveBeenCalledWith(CALL_ID);
    expect(JSONSchemaPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: expect.objectContaining({ note: 'RingCX notes' }),
      }),
      expect.anything(),
    );
  });

  test('opens a form queued during the call with what was submitted', () => {
    render(
      <WrapUpPanel
        {...props({
          isDisposed: true,
          wrapUp: wrapUp({
            entry: {
              hasDispositionStep: false,
              formStatus: 'ready',
              logStatus: 'failed',
              logError: 'CRM is down',
              queuedFormData: { contact: 'contact-1', note: 'Queued note' },
            },
          }),
        })}
      />,
    );

    expect(JSONSchemaPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { contact: 'contact-1', note: 'Queued note' },
      }),
      expect.anything(),
    );
  });
});

describe('WrapUpPanel Submit', () => {
  test("sends the host's form with the disposition", () => {
    const onSubmit = jest.fn();
    render(<WrapUpPanel {...props({ onSubmit })} />);

    fireEvent.click(submitButton());

    expect(onSubmit).toHaveBeenCalledWith({
      formData: { contact: 'contact-1', note: '' },
    });
  });

  test('sends no form while it is loading', () => {
    const onSubmit = jest.fn();
    render(
      <WrapUpPanel
        {...props({
          onSubmit,
          wrapUp: wrapUp({
            entry: { hasDispositionStep: true, formStatus: 'loading', logStatus: 'pending' },
          }),
        })}
      />,
    );

    fireEvent.click(submitButton());

    expect(onSubmit).toHaveBeenCalledWith({ formData: null });
  });

  test("opens the host's tab when only its required fields block Submit", () => {
    const onSubmit = jest.fn();
    const { container } = render(
      <WrapUpPanel
        {...props({
          onSubmit,
          wrapUp: wrapUp({
            logCallPage: logPage({
              required: ['contact'],
              formData: { contact: '', note: '' },
            }),
          }),
        })}
      />,
    );

    fireEvent.click(submitButton());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(activeTab(container)).toBe('log');
    expect(container.querySelector('[data-sign="wrapUpCallLogError"]')).toBeTruthy();
    expect(container.querySelector('[data-sign="wrapUpPillError"]')).toBeTruthy();

    fireEvent.click(container.querySelector('[data-sign="submitWithoutLogging"]'));
    expect(onSubmit).toHaveBeenCalledWith({ formData: null, skipLog: true });
  });

  test('offers Retry and Log later, with no hint, after a failed save', () => {
    const onSubmit = jest.fn();
    const onLogLater = jest.fn();
    const { container } = render(
      <WrapUpPanel
        {...props({
          isDisposed: true,
          onSubmit,
          onLogLater,
          wrapUp: wrapUp({
            entry: {
              hasDispositionStep: true,
              formStatus: 'ready',
              logStatus: 'failed',
              logError: 'CRM is down',
            },
          }),
        })}
      />,
    );

    expect(container.querySelector('[data-sign="wrapUpCallLogError"]').textContent).toContain(
      'CRM is down',
    );
    expect(container.querySelector('p')).toBeNull();

    fireEvent.click(container.querySelector('[data-sign="wrapUpRetry"]'));
    expect(onSubmit).toHaveBeenCalledWith({
      formData: { contact: 'contact-1', note: '' },
    });
    fireEvent.click(container.querySelector('[data-sign="wrapUpLogLater"]'));
    expect(onLogLater).toHaveBeenCalled();
  });

  test('marks a call log queued during the call', () => {
    const { container } = render(
      <WrapUpPanel
        {...props({
          callEnded: false,
          isDisposed: true,
          wrapUp: wrapUp({
            entry: {
              hasDispositionStep: true,
              formStatus: 'ready',
              logStatus: 'queued',
              queuedFormData: { contact: 'contact-1', note: '' },
            },
          }),
        })}
      />,
    );

    expect(container.querySelector('[data-sign="wrapUpPillQueued"]')).toBeTruthy();
  });
});

describe('WrapUpPanel notes sync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function withNotes(notes, overrides = {}) {
    return props({
      dispositionData: { dispositionId: 'disp-1', notes, summary: '' },
      ...overrides,
    });
  }

  test('follows Notes into the log note and tells the host once typing stops', () => {
    const onLogFormChange = jest.fn();
    const { rerender } = render(<WrapUpPanel {...withNotes('', { onLogFormChange })} />);

    rerender(<WrapUpPanel {...withNotes('Asked', { onLogFormChange })} />);
    rerender(<WrapUpPanel {...withNotes('Asked for pricing', { onLogFormChange })} />);

    expect(JSONSchemaPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { contact: 'contact-1', note: 'Asked for pricing' },
      }),
      expect.anything(),
    );
    expect(onLogFormChange).not.toHaveBeenCalled();
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onLogFormChange).toHaveBeenCalledTimes(1);
    expect(onLogFormChange).toHaveBeenCalledWith(
      { contact: 'contact-1', note: 'Asked for pricing' },
      ['note'],
    );
  });

  test("keeps the form's own note until Notes change", () => {
    const onLogFormChange = jest.fn();
    render(
      <WrapUpPanel
        {...withNotes('', {
          onLogFormChange,
          wrapUp: wrapUp({
            logCallPage: logPage({ formData: { contact: 'contact-1', note: 'AI note' } }),
          }),
        })}
      />,
    );
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(JSONSchemaPage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        formData: { contact: 'contact-1', note: 'AI note' },
      }),
      expect.anything(),
    );
    expect(onLogFormChange).not.toHaveBeenCalled();
  });

  test('stops following once the agent edits the log note, until Use notes', () => {
    JSONSchemaPage.mockImplementation(({ formData, onFormDataChange }) => (
      <button
        type="button"
        data-sign="editNote"
        onClick={() => onFormDataChange({ ...formData, note: 'Edited here' })}
      >
        {formData.note}
      </button>
    ));
    const onLogFormChange = jest.fn();
    const { container, rerender } = render(
      <WrapUpPanel {...withNotes('', { onLogFormChange })} />,
    );

    fireEvent.click(container.querySelector('[data-sign="editNote"]'));
    expect(onLogFormChange).toHaveBeenCalledWith(
      { contact: 'contact-1', note: 'Edited here' },
      ['note'],
    );
    rerender(<WrapUpPanel {...withNotes('New notes', { onLogFormChange })} />);
    expect(container.querySelector('[data-sign="editNote"]').textContent).toBe('Edited here');
    expect(container.querySelector('[data-sign="wrapUpNoteSync"]').textContent).toContain(
      'noteEdited',
    );

    fireEvent.click(container.querySelector('[data-sign="wrapUpUseNotes"]'));
    expect(container.querySelector('[data-sign="editNote"]').textContent).toBe('New notes');
    JSONSchemaPage.mockReset();
  });

  test('does not follow Notes when the form has no note field', () => {
    const page = logPage();
    delete page.schema.properties.note;
    const { container, rerender } = render(
      <WrapUpPanel {...withNotes('', { wrapUp: wrapUp({ logCallPage: page }) })} />,
    );

    rerender(
      <WrapUpPanel {...withNotes('Asked', { wrapUp: wrapUp({ logCallPage: page }) })} />,
    );

    expect(container.querySelector('[data-sign="wrapUpNoteSync"]')).toBeNull();
  });
});
