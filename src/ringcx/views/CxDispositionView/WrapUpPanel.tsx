import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Button, Icon, Tab, TabContext, Tabs } from '@ringcentral/spring-ui';
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
import type { WrapUpPillMark } from '../../components/WrapUp';
import {
  DispositionRecap,
  WrapUpCallLog,
  WrapUpPillLabel,
  WrapUpTimer,
} from '../../components/WrapUp';
import type { WrapUpPanelProps } from './WrapUpPanel.interface';
import i18n from './i18n';

type WrapUpTab = 'disposition' | 'log';

/** How long the notes sync waits before it tells the host. */
const NOTE_SYNC_DELAY = 500;

/**
 * The RingCX wrap-up page for a call: its disposition and the host's call
 * log form, with one Submit. With both parts they are pill tabs named
 * Disposition and the host; a page with one part shows it on its own, named
 * by its side widget tab.
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
  const useTabs = showLog && showDispositionPart;

  const [activeTab, setActiveTab] = useState<WrapUpTab>(
    dispositionSaved ? 'log' : 'disposition',
  );
  // A saved disposition leaves only the call log to do.
  useEffect(() => {
    if (dispositionSaved && showLog) {
      setActiveTab('log');
    }
  }, [dispositionSaved, showLog]);

  const [logBlocked, setLogBlocked] = useState(false);
  const requiredLogFieldsFilled = page
    ? allRequiredFieldsAreFilled(formData, page.schema ?? {})
    : true;
  useEffect(() => {
    if (requiredLogFieldsFilled) {
      setLogBlocked(false);
    }
  }, [requiredLogFieldsFilled]);

  // Notes sync: the log note follows Notes until the agent edits it.
  const [noteEdited, setNoteEdited] = useState(false);
  useEffect(() => {
    setNoteEdited(false);
  }, [callId]);
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
  // Only a change to Notes is followed: the form's own prefill, such as the
  // default form's AI note, stays until the agent types notes.
  const syncedNotes = useRef(notes);
  useEffect(() => {
    if (syncedNotes.current === notes) {
      return;
    }
    syncedNotes.current = notes;
    if (canSyncNote && !noteEdited) {
      syncNote(notes);
    }
  }, [notes]);

  const onLogFormDataChange = (next: UnknownRecord, keys: string[]) => {
    setFormData(next);
    if (canSyncNote && keys.includes('note')) {
      setNoteEdited(true);
    }
    onLogFormChange(next, keys);
  };

  const dispositionInvalid =
    showDispositionPart &&
    !dispositionSaved &&
    ((dispositionPickList.length > 0 && !dispositionData?.dispositionId) ||
      (required.notes && !dispositionData?.notes));

  const submit = (): void => {
    if (hasLogForm && !requiredLogFieldsFilled && !isLogDone) {
      if (dispositionInvalid || !validated.dispositionId || !validated.notes) {
        setActiveTab('disposition');
        onSubmit({ formData: null });
        return;
      }
      setLogBlocked(true);
      setActiveTab('log');
      return;
    }
    if (!validated.dispositionId || !validated.notes) {
      setActiveTab('disposition');
    }
    onSubmit({ formData: hasLogForm ? formData : null });
  };

  const dispositionMark: WrapUpPillMark = dispositionSaved
    ? 'done'
    : isSaving
      ? 'saving'
      : !validated.dispositionId || !validated.notes
        ? 'error'
        : 'none';
  const logMark: WrapUpPillMark =
    logStatus === 'saving'
      ? 'saving'
      : logStatus === 'saved'
        ? 'done'
        : logStatus === 'failed' || logBlocked
          ? 'error'
          : isLogQueued
            ? 'queued'
            : 'none';

  const panelClassName = (tab: WrapUpTab): string | undefined =>
    clsx(useTabs && activeTab !== tab && 'hidden');

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
    <div className={panelClassName('disposition')} data-sign="wrapUpDisposition">
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
    <div className={panelClassName('log')} data-sign="wrapUpLog">
      <WrapUpCallLog
        status={logPartStatus}
        loadingText={t('logFormLoading', { host: hostName })}
        noFormText={
          entry?.noLogFormReason || t('noLogForm', { host: hostName })
        }
        page={page}
        formData={formData}
        onChange={onLogFormDataChange}
        onButtonClick={onLogFormButtonClick}
        onSubmit={() => submit()}
        errorText={logErrorText}
        locked={logStatus === 'saving' || isSaved}
        noteSync={
          canSyncNote
            ? {
                edited: noteEdited,
                text: noteEdited ? t('noteEdited') : t('noteFollowsNotes'),
                useNotesLabel: t('useNotes'),
                onUseNotes: () => {
                  setNoteEdited(false);
                  syncNote(notes);
                },
              }
            : null
        }
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
  } else if (showDispositionPart || showLog) {
    const savesDisposition = showDispositionPart && !dispositionSaved;
    // With only the call log left, the button reads as the host's own save
    // button on the log page.
    const label = savesDisposition
      ? t(submitEndsCall ? 'submitAndHangUp' : 'submit')
      : page?.uiSchema?.submitButtonOptions?.submitText || t('save');
    const isBusy = isSaving || logStatus === 'saving';
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
        <Button
          data-sign="submitButton"
          size="large"
          fullWidth
          disabled={
            submitBlockedByVoicemailDrop ||
            isBusy ||
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
        {useTabs ? (
          <TabContext
            value={activeTab}
            onChange={(_, value) => setActiveTab(value as WrapUpTab)}
          >
            {/*
              The pill tab list pads 2px above, 10px below and 4px to the
              left of the pills; the wrapper offsets that so the pills sit
              14px from the header and the first field, lined up with the
              field labels.
            */}
            <div className="sticky top-0 z-10 -ml-1 bg-neutral-base pt-3">
              <Tabs
                variant="scrollable"
                pill
                size="small"
                aria-label={t('wrapUpForms')}
                data-sign="wrapUpPillTabs"
              >
                <Tab
                  value="disposition"
                  id="wrapUpTab-disposition"
                  data-sign="wrapUpTab-disposition"
                  label={
                    <WrapUpPillLabel
                      text={t('disposition')}
                      mark={dispositionMark}
                      needsInputLabel={t('needsInput')}
                      savedLabel={t('saved')}
                    />
                  }
                />
                <Tab
                  value="log"
                  id="wrapUpTab-log"
                  data-sign="wrapUpTab-log"
                  label={
                    <WrapUpPillLabel
                      text={hostName}
                      mark={logMark}
                      needsInputLabel={t('needsInput')}
                      savedLabel={t('saved')}
                      queuedLabel={t('logQueued')}
                    />
                  }
                />
              </Tabs>
            </div>
          </TabContext>
        ) : null}
        <div className={useTabs ? 'pt-1' : 'pt-4'}>
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
