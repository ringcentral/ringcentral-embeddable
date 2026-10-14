import React, { useRef } from 'react';
import {
  action,
  computed,
  delegate,
  injectable,
  optional,
  RcViewModule,
  RouterPlugin,
  state,
  useConnector,
  watch,
  type UIProps,
  type UIFunctions,
} from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  AppFooterNav,
  AppHeaderNav,
} from '@ringcentral-integration/micro-core/src/app/components';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';

import type { CxTransferType } from '../../enums';
import { directTransferTypes, transferTypes } from '../../enums';
import {
  CxTransferCall,
  type CxTransferMode,
} from '../../services/CxTransferCall';
import { CxRequeueCall } from '../../services/CxRequeueCall';
import { CxCall } from '../../services/CxCall';
import { CxAuth } from '../../services/CxAuth';
import {
  CxDirectorySearch,
  directorySearchScopes,
  formatDirectoryRecordName,
  type DirectoryRecord,
} from '../../services/CxDirectorySearch';
import { isDialableNumberInput } from '../../lib/isDialableNumberInput';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber';
import { cxPath } from '../../routes';
import { TransferPanel } from '../../components/TransferPanel';
import type {
  CxTransferViewOptions,
  CxTransferViewProps,
  TransferTab,
  CxTransferViewUIProps,
  CxTransferViewUIFunctions,
} from './CxTransferView.interface';
import i18n, { t as translate } from './i18n';

/**
 * CxTransferView - Unified transfer view with tabbed navigation.
 * Replaces the multi-page transfer flow with a single page using
 * pill tabs for transfer type selection and inline destination selection.
 */
@injectable({
  name: 'CxTransferView',
})
class CxTransferView extends RcViewModule {
  constructor(
    private _cxTransferCall: CxTransferCall,
    private _cxRequeueCall: CxRequeueCall,
    private _cxCall: CxCall,
    private _cxAuth: CxAuth,
    private _cxDirectorySearch: CxDirectorySearch,
    private _router: RouterPlugin,
    private _toast: Toast,
    @optional('CxTransferViewOptions')
    private _options?: CxTransferViewOptions,
  ) {
    super();
  }

  private readonly _searchScope = directorySearchScopes.transferManualEntry;

  override onInitOnce() {
    // Check voicemail as soon as a directory user becomes the destination,
    // whether picked from the list or matched by an extension on the keypad
    watch(
      this,
      () => this.voicemailCandidateExtensionId,
      () => this._checkVoicemail(),
    );
  }

  @state
  private _manualEntryNumber = '';

  /**
   * Only the id is kept, not the record: a selection is meaningful just while
   * the record is still in the result list, so looking it up on read means a
   * new search or a cleared list drops the selection with no extra bookkeeping.
   */
  @state
  private _selectedDirectoryRecordId: string | null = null;

  /**
   * Whether the current input was entered on the keypad rather than typed.
   * Decides whether directory results are allowed to take over the tab body.
   */
  @state
  private _isInputFromKeypad = false;

  @action
  private _setInputFromKeypad(fromKeypad: boolean) {
    this._isInputFromKeypad = fromKeypad;
  }

  @action
  private _setManualEntryNumber(value: string) {
    this._manualEntryNumber = value;
  }

  @action
  private _setSelectedDirectoryRecordId(id: string | null) {
    this._selectedDirectoryRecordId = id;
  }

  get manualEntryDirectoryRecords(): DirectoryRecord[] {
    return this._cxDirectorySearch.getRecords(this._searchScope);
  }

  get selectedDirectoryRecordId(): string | null {
    return this.selectedDirectoryRecord?.id ?? null;
  }

  get selectedDirectoryRecord(): DirectoryRecord | null {
    if (!this._selectedDirectoryRecordId) return null;
    return (
      this.manualEntryDirectoryRecords.find(
        (record) => record.id === this._selectedDirectoryRecordId,
      ) ?? null
    );
  }

  get isSearchingDirectory(): boolean {
    return this._cxDirectorySearch.isSearching(this._searchScope);
  }

  /**
   * The keypad yields the tab body to directory results, except while the agent
   * is entering on the pad itself: pad input searches now, so without that
   * exception the list would appear mid-entry and pull the pad out from under
   * the next keypress. Entering on the pad surfaces an exact extension match as
   * a name above it instead, while typing keeps the full pickable list.
   */
  get showManualEntryKeypad(): boolean {
    return (
      this._isInputFromKeypad ||
      !this._cxDirectorySearch.hasResults(this._searchScope)
    );
  }

  /**
   * The directory member whose extension is exactly what has been typed. This
   * is what makes a keypad-entered extension transferable: on its own it is not
   * a routable destination.
   */
  get matchedDirectoryRecord(): DirectoryRecord | null {
    return this._cxDirectorySearch.findExactExtensionMatch(
      this._searchScope,
      this._manualEntryNumber,
    );
  }

  get matchedDirectoryName(): string {
    const record = this.matchedDirectoryRecord;
    return record ? formatDirectoryRecordName(record) : '';
  }

  /**
   * A name in the field means the agent is searching the directory rather than
   * entering a destination. Transferring it would hand it to `parseNumber`,
   * which throws, so the typed value only counts once it looks dialable.
   */
  get isManualEntryDialable(): boolean {
    return isDialableNumberInput(this._manualEntryNumber);
  }

  /**
   * What the manual tab would transfer to right now, or null if there is
   * nothing usable.
   *
   * A record the agent picked from the list wins over the typed text, since the
   * text is only the search query that produced it. Failing that, an extension
   * typed on the keypad resolves through its exact directory match, because the
   * digits alone are not a routable destination. A plain phone number is used
   * as typed.
   */
  get manualEntryDestination(): { value: string; skipParse: boolean } | null {
    const record = this.selectedDirectoryRecord ?? this.matchedDirectoryRecord;
    if (record) {
      const destination = this._cxDirectorySearch.buildRecordDestination(
        this._searchScope,
        record,
      );
      if (destination) {
        return { value: destination, skipParse: true };
      }
    }
    return this.isManualEntryDialable
      ? { value: this._manualEntryNumber, skipParse: false }
      : null;
  }

  /**
   * The RC extension id of the directory user a voicemail transfer would go
   * to, or null. Only a corporate directory user qualifies: other extension
   * types (call queues, IVR menus, ...) have no personal mailbox, and the other
   * tabs never resolve to a RingEX extension at all.
   */
  get voicemailCandidateExtensionId(): string | null {
    if (this._cxTransferCall.transferType !== transferTypes.manualEntry) {
      return null;
    }
    const record = this.selectedDirectoryRecord ?? this.matchedDirectoryRecord;
    if (
      record?.type?.toLowerCase() !== 'user' ||
      !this.manualEntryDestination?.skipParse
    ) {
      return null;
    }
    return record.id;
  }

  /**
   * A directory user whose extension the server confirmed takes voicemail.
   * Until the check answers, the user does not count.
   */
  get isVoicemailDestination(): boolean {
    const extensionId = this.voicemailCandidateExtensionId;
    return (
      !!extensionId &&
      this._cxTransferCall.voicemailEnabledByExtension[extensionId] === true
    );
  }

  /**
   * Who the Transfer button would transfer to, named where the directory knows
   * them. Empty on the other tabs, whose destination is already spelled out in
   * the tab itself, and empty when there is nothing transferable.
   */
  get transferDestinationLabel(): string {
    if (this._cxTransferCall.transferType !== transferTypes.manualEntry) {
      return '';
    }
    // A record is labelled by name and extension rather than by the field,
    // which for a name search holds the query text, not a number
    const record = this.selectedDirectoryRecord ?? this.matchedDirectoryRecord;
    if (record) {
      return [formatDirectoryRecordName(record), record.extensionNumber]
        .filter(Boolean)
        .join(' ');
    }
    return this.isManualEntryDialable
      ? formatPhoneNumber({ phoneNumber: this._manualEntryNumber.trim() })
      : '';
  }

  /**
   * The view runs in a client port while its state lives on the server, so
   * every handler in this view that mutates state has to be delegated: a
   * client-side action is replaced by the server's copy on the next full-state
   * sync, which reverted the user's input a few seconds after they made it.
   */
  @delegate('server')
  async setManualEntryNumber(value: string): Promise<void> {
    this._setManualEntryNumber(value);
    this._setSelectedDirectoryRecordId(null);
    this._setInputFromKeypad(false);
    this._cxTransferCall.changeTransferType(transferTypes.manualEntry);
    this._cxDirectorySearch.search(this._searchScope, value);
  }

  /**
   * Pick a directory record as the transfer destination.
   *
   * Selecting only marks the row: the footer Transfer button issues the
   * transfer, like the agent and phone book tabs. The pending search is
   * cancelled so a late response cannot drop the record out of the list and
   * silently unselect it.
   */
  @delegate('server')
  async selectDirectoryRecord(record: DirectoryRecord): Promise<void> {
    this._cxDirectorySearch.cancel(this._searchScope);
    this._setSelectedDirectoryRecordId(record.id);
    this._cxTransferCall.changeTransferType(transferTypes.manualEntry);
    // Picking the same user again does not change what the watch in
    // `onInitOnce` sees, so retry a check that failed from here
    this._checkVoicemail();
  }

  private _checkVoicemail(): void {
    const extensionId = this.voicemailCandidateExtensionId;
    if (!extensionId) return;
    this._cxTransferCall.checkVoicemail(extensionId).catch((error) => {
      this.logger.warn('checkVoicemail failed', error);
    });
  }

  /**
   * Append a keypad key to the manual entry field.
   *
   * Keypad input searches the directory just like typing does: an extension
   * entered on the pad is only transferable once the search has resolved it to
   * a member. Appending happens here rather than in the component so that rapid
   * presses cannot drop a key while state syncs back to the client port.
   */
  @delegate('server')
  async appendManualEntryKey(key: string): Promise<void> {
    const value = this._manualEntryNumber + key;
    this._setManualEntryNumber(value);
    this._setSelectedDirectoryRecordId(null);
    this._setInputFromKeypad(true);
    this._cxTransferCall.changeTransferType(transferTypes.manualEntry);
    this._cxDirectorySearch.search(this._searchScope, value);
  }

  /**
   * Slicing runs on the server so it reads the authoritative value. The input
   * source is deliberately left alone: correcting a keypad entry should not
   * flip the tab over to the result list mid-correction.
   */
  @delegate('server')
  async backspaceManualEntry(): Promise<void> {
    const value = this._manualEntryNumber.slice(0, -1);
    this._setManualEntryNumber(value);
    this._setSelectedDirectoryRecordId(null);
    this._cxTransferCall.changeTransferType(transferTypes.manualEntry);
    this._cxDirectorySearch.search(this._searchScope, value);
  }

  @delegate('server')
  async clearManualEntry(): Promise<void> {
    await this.setManualEntryNumber('');
  }

  get callId(): string {
    return this._cxCall.activityCallId;
  }

  get isQueueTransfer(): boolean {
    return this._cxTransferCall.transferType === transferTypes.queue;
  }

  /** Whether a transfer can be issued right now, regardless of destination */
  private get _canTransferNow(): boolean {
    return (
      !this._cxTransferCall.transferring &&
      !this._cxRequeueCall.requeuing &&
      !this._cxCall.currentCall?.endedCall
    );
  }

  /** Whether the current call allows non-queue transfer actions */
  get allowTransferCall(): boolean {
    const call = this._cxCall.currentCall;
    return !!(call?.allowTransfer && !call?.endedCall);
  }

  @computed((that: CxTransferView) => [
    that._cxCall.currentCall,
    that._cxTransferCall.allowInternalTransfer,
    that._cxTransferCall.transferPhoneBook,
    that._cxRequeueCall.allowRequeueCall,
  ])
  get allTabs(): TransferTab[] {
    const canTransfer = this.allowTransferCall;
    return [
      {
        value: transferTypes.internal,
        label: translate('internalTransfer'),
        disabled: !canTransfer || !this._cxTransferCall.allowInternalTransfer,
      },
      {
        value: transferTypes.queue,
        label: translate('queue'),
        disabled: !this._cxRequeueCall.allowRequeueCall,
      },
      {
        value: transferTypes.phoneBook,
        label: translate('phoneBook'),
        disabled:
          !canTransfer || this._cxTransferCall.transferPhoneBook.length === 0,
      },
      {
        value: transferTypes.manualEntry,
        label: translate('manualEntry'),
        disabled: !canTransfer,
      },
    ];
  }

  @computed((that: CxTransferView) => [that.allTabs])
  get defaultTab(): CxTransferType | null {
    const firstEnabled = this.allTabs.find((tab) => !tab.disabled);
    return firstEnabled?.value ?? null;
  }

  @computed((that: CxTransferView) => [that.allTabs])
  get hasAvailableTab(): boolean {
    return this.allTabs.some((tab) => !tab.disabled);
  }

  @computed((that: CxTransferView) => [
    that._cxTransferCall.transferType,
    that._cxTransferCall.transferAgentId,
    that._cxTransferCall.transferPhoneBookSelectedIndex,
    that._manualEntryNumber,
    that._selectedDirectoryRecordId,
    that.manualEntryDirectoryRecords,
    that.isSearchingDirectory,
    that._cxRequeueCall.selectedGateId,
    that._cxTransferCall.transferring,
    that._cxRequeueCall.requeuing,
    that._cxCall.currentCall,
  ])
  get isTransferDisabled(): boolean {
    const { transferType } = this._cxTransferCall;
    if (!this._canTransferNow) return true;
    switch (transferType) {
      case transferTypes.internal:
        return !this._cxTransferCall.transferAgentId;
      case transferTypes.phoneBook:
        return this._cxTransferCall.transferPhoneBookSelectedIndex === null;
      case transferTypes.manualEntry:
        // A search in flight means the destination is not settled yet: the
        // extension being typed resolves to a member only once results land, so
        // transferring now would either be rejected or go to the previous
        // query's match.
        return this.isSearchingDirectory || !this.manualEntryDestination;
      case transferTypes.queue:
        return !this._cxRequeueCall.selectedGateId;
      default:
        return true;
    }
  }

  /**
   * Same gate as Ask first and Transfer (which already waits for a directory
   * search to settle), plus a directory user as the destination.
   */
  @computed((that: CxTransferView) => [
    that.isTransferDisabled,
    that.isVoicemailDestination,
  ])
  get isVoicemailDisabled(): boolean {
    return this.isTransferDisabled || !this.isVoicemailDestination;
  }

  /**
   * Carry out the transfer chosen in the footer: Ask first (WARM), Transfer
   * (COLD) or Voicemail. On the queue tab Ask first and Transfer map to a
   * requeue that keeps or drops the agent.
   */
  @delegate('server')
  async executeTransfer(mode: CxTransferMode): Promise<void> {
    const isVoicemail = mode === directTransferTypes.VOICEMAIL;
    try {
      if (this.isQueueTransfer) {
        if (isVoicemail) return;
        await this._cxRequeueCall.requeueCall({
          maintain: mode === directTransferTypes.WARM,
        });
      } else {
        if (isVoicemail && !this.isVoicemailDestination) return;
        if (this._cxTransferCall.transferType === transferTypes.manualEntry) {
          const destination = this.manualEntryDestination;
          if (!destination) return;
          // A picked directory record is a fully-qualified EV destination and
          // skips the parser; a typed number goes through it as before
          this._cxTransferCall.changeRecipientNumber(destination.value, {
            skipParse: destination.skipParse,
          });
          this._cxDirectorySearch.cancel(this._searchScope);
        }
        await this._cxTransferCall.transfer(mode);
        if (isVoicemail) {
          this._toast.success({ message: translate('voicemailTransferSuccess') });
        }
      }
      // Only on success: a failed transfer keeps the destination so the agent
      // can retry it. Without this the number outlives the call, and the panel
      // opened on the previous transfer's input for the next one.
      this._resetManualEntry();
      this._returnToActiveCall();
    } catch (error) {
      if (isVoicemail) {
        this._toast.danger({ message: translate('voicemailTransferFailed') });
      }
      this.logger.error('Transfer failed:', error);
    }
  }

  /** Drop the manual tab's destination: typed number, pick and search results */
  private _resetManualEntry(): void {
    this._setManualEntryNumber('');
    this._setSelectedDirectoryRecordId(null);
    this._setInputFromKeypad(false);
    this._cxDirectorySearch.clear(this._searchScope);
  }

  /**
   * A cold or voicemail transfer ends the agent's call, and Redirect
   * routes to the disposition page from its own `onCallEnded` handler. That can
   * land before the transfer request resolves, so only navigate while the
   * transfer page is still the current route: otherwise this replaces the
   * disposition page with the active call page for a call that has already
   * ended, leaving the user on a call they cannot hang up.
   */
  private _returnToActiveCall(): void {
    if (!/^\/agent\/calls\/.+\/transfer$/.test(this._router.currentPath)) {
      return;
    }
    this._router.replace(cxPath.call(this.callId));
  }

  /**
   * Leaving the page without transferring cancels the transfer: there is no
   * Cancel button, the header back button is the way out.
   */
  @delegate('server')
  async cancelTransfer(): Promise<void> {
    this._cxTransferCall.resetTransferStatus();
    this._resetManualEntry();
    this._options?.onCancel?.();
    this._router.replace(cxPath.call(this.callId));
  }

  /**
   * Also covers mount: TransferPanel reports its initially active tab through
   * `onTabChange`, so opening the page always starts with an empty result list
   * even though `_manualEntryNumber` survives between visits.
   */
  @delegate('server')
  async handleTabChange(type: CxTransferType): Promise<void> {
    this._setSelectedDirectoryRecordId(null);
    this._cxDirectorySearch.clear(this._searchScope);
    this._cxTransferCall.changeTransferType(type);
    if (type === transferTypes.internal) {
      await this._cxTransferCall.fetchAgentList();
    }
  }

  @delegate('server')
  async selectAgent(agentId: string): Promise<void> {
    this._cxTransferCall.changeTransferAgentId(agentId);
    this._cxTransferCall.changeTransferType(transferTypes.internal);
  }

  @delegate('server')
  async selectPhoneBookContact(index: number | null): Promise<void> {
    this._cxTransferCall.changeTransferPhoneBookSelected(index);
    this._cxTransferCall.changeTransferType(transferTypes.phoneBook);
  }

  @delegate('server')
  async fetchAgentList(): Promise<void> {
    await this._cxTransferCall.fetchAgentList();
  }

  @delegate('server')
  async handleQueueGroupChange(groupId: string): Promise<void> {
    this._cxRequeueCall.setStatus({
      selectedQueueGroupId: groupId,
      selectedGateId: '',
    });
  }

  @delegate('server')
  async handleGateChange(gateId: string): Promise<void> {
    this._cxRequeueCall.setStatus({ selectedGateId: gateId });
  }

  getUIProps(): UIProps<CxTransferViewUIProps> {
    return {
      transferType: this._cxTransferCall.transferType,
      isTransferring:
        this._cxTransferCall.transferring || this._cxRequeueCall.requeuing,
      isDisabled: this.isTransferDisabled,
      isVoicemailDisabled: this.isVoicemailDisabled,
      allTabs: this.allTabs,
      defaultTab: this.defaultTab,
      agentList: this._cxTransferCall.transferAgentList,
      phoneBook: this._cxTransferCall.transferPhoneBook,
      selectedAgentId: this._cxTransferCall.transferAgentId,
      selectedPhoneBookIndex:
        this._cxTransferCall.transferPhoneBookSelectedIndex,
      manualEntryNumber: this._manualEntryNumber,
      manualEntryDirectoryRecords: this.manualEntryDirectoryRecords,
      selectedDirectoryRecordId: this.selectedDirectoryRecordId,
      matchedDirectoryName: this.matchedDirectoryName,
      transferDestinationLabel: this.transferDestinationLabel,
      isSearchingDirectory: this.isSearchingDirectory,
      showManualEntryKeypad: this.showManualEntryKeypad,
      queueGroups: this._cxAuth.availableRequeueQueues,
      selectedQueueGroupId: this._cxRequeueCall.selectedQueueGroupId,
      selectedGateId: this._cxRequeueCall.selectedGateId,
    };
  }

  getUIFunctions(): UIFunctions<CxTransferViewUIFunctions> {
    return {
      onTabChange: (type) => this.handleTabChange(type),
      onSelectAgent: (agentId) => this.selectAgent(agentId),
      onSelectPhoneBookContact: (index) => this.selectPhoneBookContact(index),
      onManualEntryChange: (value) => this.setManualEntryNumber(value),
      onManualEntryKeypadPress: (key) => this.appendManualEntryKey(key),
      onManualEntryBackspace: () => this.backspaceManualEntry(),
      onManualEntryClear: () => this.clearManualEntry(),
      onSelectDirectoryRecord: (record) => this.selectDirectoryRecord(record),
      onQueueGroupChange: (groupId) => this.handleQueueGroupChange(groupId),
      onGateChange: (gateId) => this.handleGateChange(gateId),
      onTransfer: (mode) => this.executeTransfer(mode),
      onBack: () => this.cancelTransfer(),
      fetchAgentList: () => this.fetchAgentList(),
    };
  }

  component(_props?: CxTransferViewProps) {
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());
    const uiProps = useConnector(() => this.getUIProps());

    return (
      <>
        <AppHeaderNav override>
          <PageHeader onBackClick={uiFunctions.onBack}>
            {t('transfer')}
          </PageHeader>
        </AppHeaderNav>
        <TransferPanel
          allTabs={uiProps.allTabs}
          defaultTab={uiProps.defaultTab}
          isTransferring={uiProps.isTransferring}
          isDisabled={uiProps.isDisabled}
          isVoicemailDisabled={uiProps.isVoicemailDisabled}
          agentList={uiProps.agentList}
          phoneBook={uiProps.phoneBook}
          selectedAgentId={uiProps.selectedAgentId}
          selectedPhoneBookIndex={uiProps.selectedPhoneBookIndex}
          manualEntryNumber={uiProps.manualEntryNumber}
          manualEntryDirectoryRecords={uiProps.manualEntryDirectoryRecords}
          selectedDirectoryRecordId={uiProps.selectedDirectoryRecordId}
          matchedDirectoryName={uiProps.matchedDirectoryName}
          transferDestinationLabel={uiProps.transferDestinationLabel}
          isSearchingDirectory={uiProps.isSearchingDirectory}
          showManualEntryKeypad={uiProps.showManualEntryKeypad}
          queueGroups={uiProps.queueGroups}
          selectedQueueGroupId={uiProps.selectedQueueGroupId}
          selectedGateId={uiProps.selectedGateId}
          onTabChange={uiFunctions.onTabChange}
          onSelectAgent={uiFunctions.onSelectAgent}
          onSelectPhoneBookContact={uiFunctions.onSelectPhoneBookContact}
          onManualEntryChange={uiFunctions.onManualEntryChange}
          onManualEntryKeypadPress={uiFunctions.onManualEntryKeypadPress}
          onManualEntryBackspace={uiFunctions.onManualEntryBackspace}
          onManualEntryClear={uiFunctions.onManualEntryClear}
          onSelectDirectoryRecord={uiFunctions.onSelectDirectoryRecord}
          onQueueGroupChange={uiFunctions.onQueueGroupChange}
          onGateChange={uiFunctions.onGateChange}
          onTransfer={uiFunctions.onTransfer}
          fetchAgentList={uiFunctions.fetchAgentList}
        />
        <AppFooterNav />
      </>
    );
  }
}

export { CxTransferView };
