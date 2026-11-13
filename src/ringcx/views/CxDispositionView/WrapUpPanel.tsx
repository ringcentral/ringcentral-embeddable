import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  Button,
  Checkbox,
  FormLabel,
  Icon,
  Step,
  StepButton,
  Stepper,
} from '@ringcentral/spring-ui';
import { CheckMd } from '@ringcentral/spring-icon';
import clsx from 'clsx';
import type { FunctionComponent, ReactNode } from 'react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import type { UnknownRecord } from '../../../app/services/ThirdParty';
import {
  allRequiredFieldsAreFilled,
  hasFormField,
} from '../../../app/views/LogCallView/callLogForm.helper';
import logCallI18n from '../../../app/views/LogCallView/i18n';
import { resolveLogCallPage } from '../../../app/views/LogCallView/LogCallPage.helper';
import { useCallLogFormData } from '../../../app/views/LogCallView/useCallLogFormData';
import { CallInfoHeader } from '../../components/CallInfoHeader';
import { DispositionForm } from '../../components/DispositionForm';
import {
  DispositionRecap,
  WrapUpCallLog,
  WrapUpTimer,
} from '../../components/WrapUp';
import type { WrapUpPanelProps } from './WrapUpPanel.interface';
import i18n from './i18n';

/** The disposition step, then the host's call log step. */
type WrapUpStep = 0 | 1;

/**
 * Passed to Spring's step and its label: a shorter step with a smaller label
 * for the narrow column.
 */
const STEP_CLASSES = { horizontal: 'py-2' };
const STEP_LABEL_PROPS = {
  className: 'mt-1 block max-w-full truncate typography-descriptor',
};

/** How long the notes sync waits before it tells the host. */
const NOTE_SYNC_DELAY = 500;

/**
 * The RingCX wrap-up page for a call: its disposition and the host's call
 * log form. With both parts they are two steps, Disposition and the host:
 * Next checks the disposition and moves on, and the host step's Submit saves
 * the disposition, then the call log. A page with one part shows it on its
 * own, named by its side widget tab.
 */
export const WrapUpPanel: FunctionComponent<WrapUpPanelProps> = ({
  callId,
  basicInfo,
  isInbound,
  callEnded,
  viewLeadButton,
  showSubmitStep,
  isDisposed,
  saveStatus,
  submitEndsCall,
  submitBlockedByVoicemailDrop,
  dispositionPickList,
  dispositionData,
  validated,
  required,
  showSummary,
  summary,
  isSummaryFinal,
  isSummaryLoading,
  isSummaryEdited,
  wrapUp,
  onUpdateCallLog,
  onUpdateSummary,
  onSubmit,
  onLogLater,
  onValidateDisposition,
  onPrepareLogForm,
  onLoadLogCall,
  onLogFormChange,
  onLogFormButtonClick,
}) => {
  const { t } = useLocale(i18n);
  const { t: logCallT } = useLocale(logCallI18n);
  const {
    logMode,
    entry,
    hostName,
    logCallPage,
    logCall,
    logButtonTitle,
    logCallPageOwnerId,
    wrapUpStartTime,
  } = wrapUp;
  const isSaving = saveStatus === 'saving';
  const isSaved = saveStatus === 'saved';
  const logStatus = entry?.logStatus ?? 'pending';
  const formStatus = entry?.formStatus ?? 'idle';
  const isLogDone = logStatus === 'saved' || logStatus === 'skipped';
  // Submitted during the call: saved when the call ends.
  const isLogQueued = logStatus === 'queued';

  // The host's form is asked for as the page opens, during the call too.
  useEffect(() => {
    if (
      logMode === 'prepare' &&
      entry &&
      !isLogDone &&
      (formStatus === 'idle' ||
        (formStatus === 'ready' && logCallPageOwnerId !== callId))
    ) {
      onPrepareLogForm(callId);
    }
  }, [logMode, !!entry, isLogDone, formStatus, logCallPageOwnerId, callId]);

  // The default form is built from the call, which ends with a duration.
  useEffect(() => {
    if (logMode === 'page') {
      onLoadLogCall(callId);
    }
  }, [callEnded, logMode, callId]);

  const page = useMemo(() => {
    if (logMode === 'prepare') {
      return formStatus === 'ready' ? (logCallPage ?? null) : null;
    }
    if (logMode !== 'page' || !logCall) {
      return null;
    }
    return resolveLogCallPage(
      logCall,
      logCallPage,
      {
        addCallLogNote: logCallT('addCallLogNote'),
        contact: logCallT('contact'),
        editLog: logCallT('editLog'),
        logCall: logCallT('logCall'),
        note: logCallT('note'),
        save: logCallT('save'),
      },
      logButtonTitle,
    );
  }, [logMode, formStatus, logCallPage, logCall, logButtonTitle, logCallT]);
  // A form submitted during the call opens with what was submitted, such as
  // after its save at call end failed.
  const queuedFormData = entry?.queuedFormData;
  const formPage = useMemo(
    () => (page && queuedFormData ? { ...page, formData: queuedFormData } : page),
    [page, queuedFormData],
  );
  const { formData, setFormData } = useCallLogFormData(formPage);

  const showLog = logMode !== 'none' && (!isLogDone || isSaved);
  const logPartStatus: 'loading' | 'ready' | 'none' =
    logMode === 'prepare' && formStatus === 'none'
      ? 'none'
      : page
        ? 'ready'
        : 'loading';
  const hasLogForm = showLog && logPartStatus === 'ready';
  const showDispositionPart = showSubmitStep;
  const dispositionSaved = isDisposed;
  const useSteps = showLog && showDispositionPart;

  const [activeStep, setActiveStep] = useState<WrapUpStep>(
    dispositionSaved ? 1 : 0,
  );
  // A saved disposition leaves only the call log to do.
  useEffect(() => {
    if (dispositionSaved && showLog) {
      setActiveStep(1);
    }
  }, [dispositionSaved, showLog]);
  // A submit that finds the disposition invalid shows it again.
  const dispositionHasErrors = !validated.dispositionId || !validated.notes;
  useEffect(() => {
    if (dispositionHasErrors && !dispositionSaved) {
      setActiveStep(0);
    }
  }, [dispositionHasErrors, dispositionSaved]);

  const [logBlocked, setLogBlocked] = useState(false);
  const requiredLogFieldsFilled = page
    ? allRequiredFieldsAreFilled(formData, page.schema ?? {})
    : true;
  useEffect(() => {
    if (requiredLogFieldsFilled) {
      setLogBlocked(false);
    }
  }, [requiredLogFieldsFilled]);

  // The log note can take the disposition Notes, ticked by default. While it
  // does, the note field is read only and follows Notes.
  const [useDispositionNotes, setUseDispositionNotes] = useState(true);
  const canSyncNote =
    hasLogForm &&
    showDispositionPart &&
    !dispositionSaved &&
    !!page &&
    hasFormField(page.schema ?? {}, 'note');
  const notes = dispositionData?.notes ?? '';
  const noteSyncTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(noteSyncTimer.current), []);
  const syncNote = (value: string): void => {
    if ((formData.note ?? '') === value) {
      return;
    }
    const next = { ...formData, note: value };
    setFormData(next);
    clearTimeout(noteSyncTimer.current);
    noteSyncTimer.current = setTimeout(() => {
      onLogFormChange(next, ['note']);
    }, NOTE_SYNC_DELAY);
  };
  const followsNotes = canSyncNote && useDispositionNotes;
  // Also when the host's form arrives or is posted again.
  useEffect(() => {
    if (followsNotes) {
      syncNote(notes);
    }
  }, [followsNotes, notes, page]);

  const onLogFormDataChange = (next: UnknownRecord, keys: string[]) => {
    setFormData(next);
    onLogFormChange(next, keys);
  };

  // The form as shown: with the Notes checkbox under the host's note field,
  // where the field's help goes, and the field read only while it is ticked.
  const shownPage = useMemo(() => {
    if (!page || !canSyncNote) {
      return page;
    }
    const uiSchema = page.uiSchema ?? {};
    const noteUiSchema = (uiSchema.note ?? {}) as UnknownRecord;
    const hostHelp = noteUiSchema['ui:help'];
    return {
      ...page,
      uiSchema: {
        ...uiSchema,
        note: {
          ...noteUiSchema,
          'ui:disabled': useDispositionNotes || noteUiSchema['ui:disabled'],
          'ui:help': (
            <>
              {hostHelp ? <div>{hostHelp as ReactNode}</div> : null}
              <div className="mt-2">
                <FormLabel
                  label={t('useDispositionNotes')}
                  classes={{ label: 'typography-descriptor text-neutral-b1' }}
                  rootProps={{ 'data-sign': 'wrapUpUseDispositionNotes' }}
                >
                  <Checkbox
                    checked={useDispositionNotes}
                    onChange={(event) =>
                      setUseDispositionNotes(event.target.checked)
                    }
                  />
                </FormLabel>
              </div>
            </>
          ),
        },
      },
    };
  }, [page, canSyncNote, useDispositionNotes, t]);

  const dispositionInvalid =
    showDispositionPart &&
    !dispositionSaved &&
    ((dispositionPickList.length > 0 && !dispositionData?.dispositionId) ||
      (required.notes && !dispositionData?.notes));

  /**
   * Moves between the steps. The call log step needs a valid disposition
   * first; its errors show on the disposition step.
   */
  const goToStep = (step: WrapUpStep): void => {
    if (step === 1 && !dispositionSaved && dispositionInvalid) {
      setActiveStep(0);
      void onValidateDisposition();
      return;
    }
    setActiveStep(step);
  };

  const submit = (): void => {
    if (hasLogForm && !requiredLogFieldsFilled && !isLogDone) {
      if (dispositionInvalid || dispositionHasErrors) {
        goToStep(0);
        void onValidateDisposition();
        return;
      }
      setLogBlocked(true);
      return;
    }
    // A host with no form for the call leaves it Unlogged.
    const noLogForm = showLog && logPartStatus === 'none';
    onSubmit(
      noLogForm
        ? { formData: null, skipLog: true }
        : { formData: hasLogForm ? formData : null },
    );
  };

  // The step icon carries the status: a check once done, an alert for an
  // error, which the step's form explains.
  const dispositionStep = {
    completed: dispositionSaved || (activeStep === 1 && !dispositionInvalid),
    error: !dispositionSaved && dispositionHasErrors,
  };
  const logStep = {
    completed: logStatus === 'saved' || isLogQueued,
    error: logStatus === 'failed' || logBlocked,
  };

  const panelClassName = (step: WrapUpStep): string | undefined =>
    clsx(useSteps && activeStep !== step && 'hidden');

  // The Pending Disposition banner's timer, which hides itself on this page.
  // The call page next to it already shows a live call's duration.
  const timer =
    callEnded && wrapUpStartTime && showDispositionPart && !dispositionSaved ? (
      <WrapUpTimer startTime={wrapUpStartTime} aria-label={t('wrapUpTime')} />
    ) : null;
  const headerActions =
    timer || viewLeadButton ? (
      <div className="flex items-center gap-2">
        {timer}
        {viewLeadButton}
      </div>
    ) : undefined;

  const logErrorText =
    logStatus === 'failed'
      ? [t('logFailed', { host: hostName }), entry?.logError]
          .filter(Boolean)
          .join(' ')
      : logBlocked
        ? t('requiredLogFieldsMissing', { host: hostName })
        : undefined;

  const dispositionPart = showDispositionPart ? (
    <div className={panelClassName(0)} data-sign="wrapUpDisposition">
      {dispositionSaved && showLog ? (
        <DispositionRecap
          title={t('savedDisposition')}
          savedLabel={t('saved')}
          dispositionName={
            dispositionPickList.find(
              (item) => item.dispositionId === dispositionData?.dispositionId,
            )?.disposition ?? ''
          }
          notes={dispositionData?.notes}
        />
      ) : (
        <DispositionForm
          dispositionPickList={dispositionPickList}
          dispositionData={dispositionData}
          validated={validated}
          required={required}
          showSummary={showSummary}
          summary={summary}
          isSummaryFinal={isSummaryFinal}
          isSummaryLoading={isSummaryLoading}
          disableDispositionSelect={isDisposed || isSaving}
          onFieldChange={onUpdateCallLog}
          onSummaryChange={onUpdateSummary}
          selectPlaceholder={t('pleaseSelect')}
          dispositionErrorText={t('dispositionError')}
          notesErrorText={t('notesRequired')}
          dispositionLabel={t('disposition')}
          notesLabel={t('notes')}
          notesPlaceholder={t('enterNotes')}
          summaryLabel={isSummaryEdited ? t('summaryEdited') : t('summary')}
          summaryPlaceholder={t('summaryPlaceholder')}
          summaryLoadingText={t('summaryLoading')}
        />
      )}
    </div>
  ) : null;

  const logPart = showLog ? (
    <div className={panelClassName(1)} data-sign="wrapUpLog">
      <WrapUpCallLog
        status={logPartStatus}
        loadingText={t('logFormLoading', { host: hostName })}
        noFormText={
          entry?.noLogFormReason || t('noLogForm', { host: hostName })
        }
        page={shownPage}
        formData={formData}
        onChange={onLogFormDataChange}
        onButtonClick={onLogFormButtonClick}
        onSubmit={() => submit()}
        errorText={logErrorText}
        locked={logStatus === 'saving' || isSaved}
      />
    </div>
  ) : null;

  let footer: ReactNode = null;
  const onlyNoFormLeft =
    showLog && logPartStatus === 'none' && (!showDispositionPart || dispositionSaved);
  if (logStatus === 'failed' && !isSaved) {
    footer = (
      <>
        <div className="flex gap-2">
          <Button
            variant="outlined"
            color="neutral"
            fullWidth
            data-sign="wrapUpLogLater"
            onClick={onLogLater}
          >
            {t('logLater')}
          </Button>
          <Button fullWidth data-sign="wrapUpRetry" onClick={submit}>
            {t('retry')}
          </Button>
        </div>
      </>
    );
  } else if (onlyNoFormLeft) {
    footer = (
      <Button fullWidth data-sign="wrapUpClose" onClick={onLogLater}>
        {t('close')}
      </Button>
    );
  } else if (useSteps && activeStep === 0) {
    // The disposition step saves nothing: Next checks it and moves on.
    footer = (
      <Button
        data-sign="wrapUpNext"
        size="large"
        fullWidth
        disabled={isSaving}
        onClick={() => goToStep(1)}
      >
        {t('next')}
      </Button>
    );
  } else if (showDispositionPart || showLog) {
    const savesDisposition = showDispositionPart && !dispositionSaved;
    // With only the call log left, the button reads as the host's own save
    // button on the log page.
    const label = savesDisposition
      ? t(submitEndsCall ? 'submitAndHangUp' : 'submit')
      : page?.uiSchema?.submitButtonOptions?.submitText || t('save');
    const isBusy = isSaving || logStatus === 'saving';
    // With both parts, the call log step waits for the host's form.
    const waitsForLogForm = useSteps && !hasLogForm && logPartStatus === 'loading';
    const submitButton = (
      <Button
        data-sign="submitButton"
        size="large"
        fullWidth
        disabled={
          submitBlockedByVoicemailDrop ||
          isBusy ||
          waitsForLogForm ||
          (!isSaved && savesDisposition && dispositionInvalid) ||
          (!isSaved && !savesDisposition && !hasLogForm)
        }
        loading={isBusy}
        onClick={submit}
        color={isSaved ? 'success' : 'primary'}
      >
        {isSaved ? (
          <Icon symbol={CheckMd} size="medium" />
        ) : isBusy ? null : (
          label
        )}
      </Button>
    );
    footer = (
      <>
        {submitBlockedByVoicemailDrop ? (
          <p
            className="typography-descriptor text-neutral-b2"
            data-sign="submitBlockedByVoicemailDrop"
          >
            {t('submitAfterVoicemailDrop')}
          </p>
        ) : null}
        {useSteps && savesDisposition ? (
          <div className="flex gap-2">
            <Button
              data-sign="wrapUpBack"
              size="large"
              variant="outlined"
              color="neutral"
              fullWidth
              disabled={isBusy || isSaved}
              onClick={() => setActiveStep(0)}
            >
              {t('back')}
            </Button>
            {submitButton}
          </div>
        ) : (
          submitButton
        )}
        {logBlocked ? (
          <Button
            variant="text"
            color="neutral"
            fullWidth
            data-sign="submitWithoutLogging"
            onClick={() => onSubmit({ formData: null, skipLog: true })}
          >
            {t('submitWithoutLogging')}
          </Button>
        ) : null}
      </>
    );
  }

  return (
    <>
      <CallInfoHeader
        subject={basicInfo?.subject}
        isInbound={isInbound}
        status={callEnded ? 'callEnd' : 'active'}
        isRinging={!callEnded}
        followInfos={basicInfo?.followInfos}
        callInfos={basicInfo?.callInfos}
        actions={headerActions}
      />
      <div
        className="flex-1 overflow-auto px-4 pb-4"
        data-sign="wrapUpPage"
      >
        {/* Scrolls with the form, so a long form keeps the column. */}
        {useSteps ? (
          <div data-sign="wrapUpSteps">
            <Stepper activeStep={activeStep} nonLinear aria-label={t('wrapUpSteps')}>
              <Step
                completed={dispositionStep.completed}
                classes={STEP_CLASSES}
                data-sign="wrapUpStep-disposition"
              >
                <StepButton
                  onClick={() => goToStep(0)}
                  StepLabelProps={{
                    error: dispositionStep.error,
                    labelProps: STEP_LABEL_PROPS,
                  }}
                >
                  {t('disposition')}
                </StepButton>
              </Step>
              <Step
                completed={logStep.completed}
                classes={STEP_CLASSES}
                data-sign="wrapUpStep-log"
              >
                <StepButton
                  onClick={() => goToStep(1)}
                  StepLabelProps={{
                    error: logStep.error,
                    labelProps: STEP_LABEL_PROPS,
                  }}
                >
                  {hostName}
                </StepButton>
              </Step>
            </Stepper>
          </div>
        ) : null}
        <div className="pt-4">
          {dispositionPart}
          {logPart}
        </div>
      </div>
      {footer ? (
        <div className="flex flex-shrink-0 flex-col gap-2 p-4 border-t border-neutral-b4 shadow-[0_-2px_5px_0_rgba(0,0,0,0.15)]">
          {footer}
        </div>
      ) : null}
    </>
  );
};
