import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-spring-page';
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { WrapUpPanel } from '../../src/ringcx/views/CxDispositionView/WrapUpPanel';

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

function logPage({
  required = [],
  formData = { contact: 'contact-1', note: '' },
  noteUiSchema,
} = {}) {
  return {
    id: '$LOG-CALL',
    title: 'Log to TestService',
    schema: {
      type: 'object',
      required,
      properties: { contact: { type: 'string' }, note: { type: 'string' } },
    },
    uiSchema: {
      submitButtonOptions: { submitText: 'Save to TestService' },
      ...(noteUiSchema ? { note: noteUiSchema } : {}),
    },
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
    onValidateDisposition: jest.fn(async () => true),
    onPrepareLogForm: jest.fn(),
    onLoadLogCall: jest.fn(),
    onLogFormChange: jest.fn(),
    onLogFormButtonClick: jest.fn(),
    ...overrides,
  };
}

const bySign = (sign) => document.querySelector(`[data-sign="${sign}"]`);
const activeStep = () =>
  bySign('wrapUpSteps')?.querySelector('ol').getAttribute('data-active-step');
const stepButton = (sign) => bySign(sign).querySelector('button');
const submitButton = () => bySign('submitButton');
const isShown = (sign) => !bySign(sign).classList.contains('hidden');

const defaultJsonSchemaPage = JSONSchemaPage.getMockImplementation();

beforeEach(() => {
  JSONSchemaPage.mockClear();
});

afterEach(() => {
  JSONSchemaPage.mockImplementation(defaultJsonSchemaPage);
});

describe('WrapUpPanel steps', () => {
  test('opens on the Disposition step with Next', () => {
    render(<WrapUpPanel {...props()} />);

    expect(activeStep()).toBe('0');
    expect(isShown('wrapUpDisposition')).toBe(true);
    expect(isShown('wrapUpLog')).toBe(false);
    expect(screen.getByText('TestService')).toBeTruthy();
    expect(bySign('wrapUpNext')).toBeTruthy();
    expect(submitButton()).toBeNull();
    // No hint under the buttons.
    expect(document.querySelector('p')).toBeNull();
  });

  test('moves on to the host step with a valid disposition', () => {
    const onValidateDisposition = jest.fn(async () => true);
    render(<WrapUpPanel {...props({ onValidateDisposition })} />);

    fireEvent.click(bySign('wrapUpNext'));

    expect(activeStep()).toBe('1');
    expect(isShown('wrapUpLog')).toBe(true);
    expect(isShown('wrapUpDisposition')).toBe(false);
    expect(bySign('wrapUpStep-disposition').getAttribute('data-completed')).toBe('true');
    expect(bySign('wrapUpBack')).toBeTruthy();
    expect(submitButton().textContent).toBe('submit');
    expect(onValidateDisposition).not.toHaveBeenCalled();
  });

  test.each([
    ['no disposition', { dispositionId: null, notes: '', summary: '' }, { notes: false }],
    ['notes the disposition requires', { dispositionId: 'disp-1', notes: '', summary: '' }, { notes: true }],
  ])('stays on the Disposition step with %s', (_name, dispositionData, required) => {
    const onValidateDisposition = jest.fn(async () => false);
    render(<WrapUpPanel {...props({ dispositionData, required, onValidateDisposition })} />);

    fireEvent.click(bySign('wrapUpNext'));
    expect(activeStep()).toBe('0');
    expect(onValidateDisposition).toHaveBeenCalledTimes(1);

    // The host step itself runs the same check.
    fireEvent.click(stepButton('wrapUpStep-log'));
    expect(activeStep()).toBe('0');
    expect(onValidateDisposition).toHaveBeenCalledTimes(2);
  });

  test('marks the Disposition step with its errors', () => {
    render(<WrapUpPanel {...props({ validated: { dispositionId: false, notes: true } })} />);

    expect(stepButton('wrapUpStep-disposition').getAttribute('data-error')).toBe('true');
    expect(stepButton('wrapUpStep-log').getAttribute('data-error')).toBe('false');
  });

  test('goes back to the Disposition step, with Back or the step itself', () => {
    render(<WrapUpPanel {...props()} />);

    fireEvent.click(bySign('wrapUpNext'));
    fireEvent.click(bySign('wrapUpBack'));
    expect(activeStep()).toBe('0');

    fireEvent.click(stepButton('wrapUpStep-log'));
    expect(activeStep()).toBe('1');
    fireEvent.click(stepButton('wrapUpStep-disposition'));
    expect(activeStep()).toBe('0');
  });

  test('returns to the Disposition step when a submit finds it invalid', () => {
    const { rerender } = render(<WrapUpPanel {...props()} />);
    fireEvent.click(bySign('wrapUpNext'));

    rerender(<WrapUpPanel {...props({ validated: { dispositionId: false, notes: true } })} />);

    expect(activeStep()).toBe('0');
  });

  test('opens on the host step once the disposition is saved', () => {
    render(<WrapUpPanel {...props({ isDisposed: true })} />);

    expect(activeStep()).toBe('1');
    expect(bySign('wrapUpStep-disposition').getAttribute('data-completed')).toBe('true');
    expect(bySign('dispositionRecap')).toBeTruthy();
    // Only the call log is left: the host's own save button, and no Back.
    expect(submitButton().textContent).toBe('Save to TestService');
    expect(bySign('wrapUpBack')).toBeNull();
  });

  test('shows a call log without a disposition step without steps', () => {
    render(
      <WrapUpPanel
        {...props({
          showSubmitStep: false,
          wrapUp: wrapUp({
            entry: { hasDispositionStep: false, formStatus: 'ready', logStatus: 'pending' },
          }),
        })}
      />,
    );

    expect(bySign('wrapUpSteps')).toBeNull();
    expect(bySign('dispositionForm')).toBeNull();
    expect(bySign('wrapUpCallLog')).toBeTruthy();
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

  test('shows only the disposition, with Submit, for a host without a log form', () => {
    render(<WrapUpPanel {...props({ wrapUp: wrapUp({ logMode: 'none', entry: null }) })} />);

    expect(bySign('wrapUpSteps')).toBeNull();
    expect(bySign('wrapUpLog')).toBeNull();
    expect(bySign('dispositionForm')).toBeTruthy();
    expect(submitButton().textContent).toBe('submit');
  });

  test('keeps the call log form mounted during the call, with no timer', () => {
    render(<WrapUpPanel {...props({ callEnded: false })} />);

    expect(bySign('wrapUpCallLog')).toBeTruthy();
    expect(bySign('wrapUpTimer')).toBeNull();
  });

  test('shows the wrap-up time until the disposition is saved', () => {
    const { rerender } = render(<WrapUpPanel {...props()} />);
    expect(bySign('wrapUpTimer')).toBeTruthy();

    rerender(<WrapUpPanel {...props({ isDisposed: true })} />);
    expect(bySign('wrapUpTimer')).toBeNull();
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
    expect(bySign('wrapUpLogFormLoading')).toBeTruthy();
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

  test("shows the host's reason, and submits the disposition only, when it has no form", () => {
    const onSubmit = jest.fn();
    render(
      <WrapUpPanel
        {...props({
          onSubmit,
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

    fireEvent.click(bySign('wrapUpNext'));
    fireEvent.click(submitButton());
    // The call stays Unlogged.
    expect(onSubmit).toHaveBeenCalledWith({ formData: null, skipLog: true });
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

    fireEvent.click(bySign('wrapUpClose'));
    expect(onLogLater).toHaveBeenCalled();
  });

  test('builds the default form from the call for a showLogModal host', () => {
    const onLoadLogCall = jest.fn();
    render(
      <WrapUpPanel
        {...props({
          showSubmitStep: false,
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

    fireEvent.click(bySign('wrapUpNext'));
    fireEvent.click(submitButton());

    expect(onSubmit).toHaveBeenCalledWith({
      formData: { contact: 'contact-1', note: '' },
    });
  });

  test('waits for the form while it is loading', () => {
    render(
      <WrapUpPanel
        {...props({
          wrapUp: wrapUp({
            entry: { hasDispositionStep: true, formStatus: 'loading', logStatus: 'pending' },
          }),
        })}
      />,
    );

    fireEvent.click(bySign('wrapUpNext'));

    expect(submitButton().disabled).toBe(true);
  });

  test('offers Submit without logging when only the required host fields block Submit', () => {
    const onSubmit = jest.fn();
    render(
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

    fireEvent.click(bySign('wrapUpNext'));
    fireEvent.click(submitButton());

    expect(onSubmit).not.toHaveBeenCalled();
    expect(activeStep()).toBe('1');
    expect(bySign('wrapUpCallLogError')).toBeTruthy();
    expect(stepButton('wrapUpStep-log').getAttribute('data-error')).toBe('true');

    fireEvent.click(bySign('submitWithoutLogging'));
    expect(onSubmit).toHaveBeenCalledWith({ formData: null, skipLog: true });
  });

  test('offers Retry and Log later, with no hint, after a failed save', () => {
    const onSubmit = jest.fn();
    const onLogLater = jest.fn();
    render(
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

    expect(bySign('wrapUpCallLogError').textContent).toContain('CRM is down');
    expect(stepButton('wrapUpStep-log').getAttribute('data-error')).toBe('true');
    expect(document.querySelector('p')).toBeNull();

    fireEvent.click(bySign('wrapUpRetry'));
    expect(onSubmit).toHaveBeenCalledWith({
      formData: { contact: 'contact-1', note: '' },
    });
    fireEvent.click(bySign('wrapUpLogLater'));
    expect(onLogLater).toHaveBeenCalled();
  });

  test('checks the host step for a call log queued during the call', () => {
    render(
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

    expect(bySign('wrapUpStep-log').getAttribute('data-completed')).toBe('true');
  });
});

describe('WrapUpPanel Use disposition notes', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Renders the note field as the form does: disabled by its uiSchema, with
    // its help under it.
    JSONSchemaPage.mockImplementation(({ formData, uiSchema, onFormDataChange }) => (
      <div>
        <textarea
          data-sign="note"
          value={formData.note ?? ''}
          disabled={Boolean(uiSchema.note?.['ui:disabled'])}
          onChange={(event) => onFormDataChange({ ...formData, note: event.target.value })}
        />
        <div data-sign="noteHelp">{uiSchema.note?.['ui:help']}</div>
      </div>
    ));
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

  const noteField = () => bySign('note');
  const useNotesCheckbox = () =>
    bySign('wrapUpUseDispositionNotes').querySelector('input[type="checkbox"]');

  test('is ticked by default: the note is read only and takes the Notes', () => {
    const onLogFormChange = jest.fn();
    render(
      <WrapUpPanel
        {...withNotes('Asked for pricing', {
          onLogFormChange,
          wrapUp: wrapUp({
            logCallPage: logPage({ formData: { contact: 'contact-1', note: 'AI note' } }),
          }),
        })}
      />,
    );

    expect(useNotesCheckbox().checked).toBe(true);
    expect(bySign('noteHelp').contains(useNotesCheckbox())).toBe(true);
    expect(noteField().disabled).toBe(true);
    expect(noteField().value).toBe('Asked for pricing');
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(onLogFormChange).toHaveBeenCalledWith(
      { contact: 'contact-1', note: 'Asked for pricing' },
      ['note'],
    );
  });

  test('follows the Notes and tells the host once typing stops', () => {
    const onLogFormChange = jest.fn();
    const { rerender } = render(<WrapUpPanel {...withNotes('', { onLogFormChange })} />);

    rerender(<WrapUpPanel {...withNotes('Asked', { onLogFormChange })} />);
    rerender(<WrapUpPanel {...withNotes('Asked for pricing', { onLogFormChange })} />);

    expect(noteField().value).toBe('Asked for pricing');
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

  test('unticked, the note is editable and stops following; ticked again, it takes the Notes', () => {
    const onLogFormChange = jest.fn();
    const { rerender } = render(
      <WrapUpPanel {...withNotes('Asked', { onLogFormChange })} />,
    );

    fireEvent.click(useNotesCheckbox());
    expect(noteField().disabled).toBe(false);
    fireEvent.change(noteField(), { target: { value: 'My own note' } });
    expect(onLogFormChange).toHaveBeenLastCalledWith(
      { contact: 'contact-1', note: 'My own note' },
      ['note'],
    );

    rerender(<WrapUpPanel {...withNotes('Asked for pricing', { onLogFormChange })} />);
    expect(noteField().value).toBe('My own note');

    fireEvent.click(useNotesCheckbox());
    expect(noteField().disabled).toBe(true);
    expect(noteField().value).toBe('Asked for pricing');
  });

  test("keeps the host's own help for the note", () => {
    render(
      <WrapUpPanel
        {...withNotes('', {
          wrapUp: wrapUp({
            logCallPage: logPage({ noteUiSchema: { 'ui:help': 'Shown on the activity' } }),
          }),
        })}
      />,
    );

    expect(bySign('noteHelp').textContent).toContain('Shown on the activity');
    expect(useNotesCheckbox()).toBeTruthy();
  });

  test('has no checkbox when the form has no note field', () => {
    const page = logPage();
    delete page.schema.properties.note;
    render(<WrapUpPanel {...withNotes('Asked', { wrapUp: wrapUp({ logCallPage: page }) })} />);

    expect(bySign('wrapUpUseDispositionNotes')).toBeNull();
    expect(noteField().disabled).toBe(false);
  });

  test('has no checkbox once the disposition is saved', () => {
    render(<WrapUpPanel {...withNotes('Asked', { isDisposed: true })} />);

    expect(bySign('wrapUpUseDispositionNotes')).toBeNull();
  });
});
