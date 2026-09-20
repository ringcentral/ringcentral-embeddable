import {
  action,
  inject,
  injectable,
  optional,
  RcViewModule,
  state,
  storage,
  StoragePlugin,
  useConnector,
  delegate,
  PortManager,
  RouterPlugin,
} from '@ringcentral-integration/next-core';
import type { UIFunctions, UIProps } from '@ringcentral-integration/next-core';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  DialTextField,
  DialPad,
  DialerPadSoundsMPEG,
  CallButton,
  Button,
  IconButton,
  Link,
  ListItem,
  ListItemText,
} from '@ringcentral/spring-ui';
import { BackspaceMd, EnterMd } from '@ringcentral/spring-icon';
import React, { useRef } from 'react';

import type { CxHostIntegration } from '../../../app/services/RingCX/RingCX.interface';
import { CxCall } from '../../services/CxCall';
import { CxAuth } from '../../services/CxAuth';
import { CxSettings } from '../../services/CxSettings';
import { CxClient } from '../../services/CxClient';
import { CxActiveCallControl } from '../../services/CxActiveCallControl';
import { CxCallMonitor } from '../../services/CxCallMonitor';
import { CxWorkingState } from '../../services/CxWorkingState';
import { cxPath } from '../../routes';
import {
  CxDirectorySearch,
  directorySearchScopes,
  formatDirectoryRecordName,
} from '../../services/CxDirectorySearch';
import { isDialableNumberInput } from '../../lib/isDialableNumberInput';
import { formatPhoneNumber } from '../../lib/FormatPhoneNumber';
import type {
  CxDialerViewOptions,
  CxDialerViewProps,
  CxDialerViewUIProps,
  CxDialerViewUIFunctions,
  DirectoryRecord,
} from './CxDialerView.interface';
import i18n from './i18n';
import type { I18nKey } from './i18n';

/**
 * CxDialerView - Phone dialer view for outbound calls
 * Displays phone number input field and call button
 */
@injectable({
  name: 'CxDialerView',
})
class CxDialerView extends RcViewModule {
  constructor(
    private cxCall: CxCall,
    private cxAuth: CxAuth,
    private cxSettings: CxSettings,
    private cxClient: CxClient,
    private cxActiveCallControl: CxActiveCallControl,
    private cxCallMonitor: CxCallMonitor,
    private cxWorkingState: CxWorkingState,
    private cxDirectorySearch: CxDirectorySearch,
    private router: RouterPlugin,
    private storagePlugin: StoragePlugin,
    private portManager: PortManager,
    @inject('CxHostIntegration')
    private readonly _host: CxHostIntegration,
    @optional('CxDialerViewOptions') private dialerViewOptions?: CxDialerViewOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
    if (this.portManager?.shared) {
      this.portManager.onServer(() => {
        this.initialize();
      });
    } else {
      this.initialize();
    }
  }

  @storage
  @state
  toNumber = '';

  @storage
  @state
  latestDialoutNumber = '';

  private readonly _searchScope = directorySearchScopes.dialer;

  /**
   * Whether the current input was entered on the keypad rather than typed.
   * Decides whether the panel below the field is the keypad or the result list.
   * Persisted with `toNumber`, so a number that survives a reload comes back
   * with the panel it was entered on.
   */
  @storage
  @state
  private _isInputFromKeypad = false;

  @action
  private _setInputFromKeypad(fromKeypad: boolean): void {
    this._isInputFromKeypad = fromKeypad;
  }

  get directoryRecords(): DirectoryRecord[] {
    return this.cxDirectorySearch.getRecords(this._searchScope);
  }

  get isSearchingDirectory(): boolean {
    return this.cxDirectorySearch.isSearching(this._searchScope);
  }

  /**
   * The directory member whose extension is exactly what has been typed. This
   * is what makes a keypad-entered extension dialable: on its own it is not a
   * routable number, so the matched record supplies the real destination.
   */
  get matchedDirectoryRecord(): DirectoryRecord | null {
    return this.cxDirectorySearch.findExactExtensionMatch(
      this._searchScope,
      this.toNumber,
    );
  }

  get matchedDirectoryName(): string {
    const record = this.matchedDirectoryRecord;
    return record ? formatDirectoryRecordName(record) : '';
  }

  /**
   * What the call button would dial, named where the directory knows it. Empty
   * for input the button would refuse anyway, so the tooltip falls back to its
   * plain label rather than reading out a half-typed name.
   */
  get dialDestinationLabel(): string {
    if (!this.isToNumberPhoneNumber) {
      return '';
    }
    const formatted = formatPhoneNumber({ phoneNumber: this.toNumber.trim() });
    return [this.matchedDirectoryName, formatted].filter(Boolean).join(' ');
  }

  /**
   * Check if agent has permission to make manual calls
   */
  get hasDialer(): boolean {
    return !!this.cxAuth.agentPermissions?.allowManualCalls;
  }

  /**
   * Check if dialout status is idle
   */
  get isIdle(): boolean {
    return this.cxCall.isIdle;
  }

  /**
   * Check if the current input looks like a phone number (no letters)
   */
  get isToNumberPhoneNumber(): boolean {
    return isDialableNumberInput(this.toNumber);
  }

  /**
   * Which panel sits below the field: the keypad, or the result list.
   *
   * Entering on the pad keeps the pad -- pad input searches now, so handing the
   * panel to the list would pull the pad out from under the next keypress, and
   * an exact extension match surfaces as a name above it instead. Typing hands
   * the panel over whether or not anything was found, because the list is the
   * only place the raw number can be dialled once the call button is hidden.
   */
  get showKeypad(): boolean {
    return !this.toNumber.trim() || this._isInputFromKeypad;
  }

  @action
  _setToNumber(value: string): void {
    this.toNumber = value;
  }

  @delegate('server')
  async setToNumber(value: string): Promise<void> {
    this._setToNumber(value);
    this._setInputFromKeypad(false);
    this.cxDirectorySearch.search(this._searchScope, value);
  }

  /**
   * Backspace deliberately leaves the input source alone: correcting a keypad
   * entry should not flip the panel over to the result list mid-correction.
   */
  @delegate('server')
  async backspaceNumber(): Promise<void> {
    const value = this.toNumber.slice(0, -1);
    this._setToNumber(value);
    this.cxDirectorySearch.search(this._searchScope, value);
  }

  /**
   * Append a keypad key to the input.
   *
   * Keypad input searches the directory just like typing does: an extension
   * entered on the pad is only dialable once the search has resolved it to a
   * member, so skipping the lookup here left the agent unable to place the
   * call. Appending happens in the module rather than the component so that
   * rapid presses cannot drop a key while state syncs back to the calling port.
   */
  @delegate('server')
  async appendToNumber(key: string): Promise<void> {
    const value = this.toNumber + key;
    this._setToNumber(value);
    this._setInputFromKeypad(true);
    this.cxDirectorySearch.search(this._searchScope, value);
  }

  @action
  setLatestDialoutNumber(): void {
    this.latestDialoutNumber = this.toNumber;
  }

  @action
  reset(): void {
    this.toNumber = '';
    this.latestDialoutNumber = '';
    this._isInputFromKeypad = false;
  }

  initialize(): void {
    // CxDirectorySearch clears its own results on agent logout
    this.cxAuth.beforeAgentLogout(() => {
      this.reset();
    });
  }

  /**
   * Initiate an outbound call.
   *
   * The call button is never shown disabled, so this is also the guard: an
   * empty field does nothing, and letters mean the user is searching the
   * directory rather than dialling, so that does nothing either instead of
   * placing a call that cannot connect.
   */
  @delegate('server')
  async dialout(): Promise<void> {
    if (!this.toNumber || !this.isToNumberPhoneNumber) {
      return;
    }
    this.setLatestDialoutNumber();
    // A matched extension has to go out as its RC_EXT destination; the raw
    // digits would not route. Falling back to the input covers a match whose
    // account has no main number to build that destination from.
    const record = this.matchedDirectoryRecord;
    const destination = record
      ? this.cxDirectorySearch.buildRecordDestination(this._searchScope, record)
      : null;
    if (destination) {
      await this.cxCall.dialout(destination, { skipParse: true });
      return;
    }
    await this.cxCall.dialout(this.toNumber);
  }

  /**
   * Dial a corporate directory record using the main_number*extension@RC_EXT format
   */
  @delegate('server')
  async dialDirectoryRecord(record: DirectoryRecord): Promise<void> {
    const destination = this.cxDirectorySearch.buildRecordDestination(
      this._searchScope,
      record,
    );
    if (!destination) {
      return;
    }
    await this.cxCall.dialout(destination, { skipParse: true });
  }

  /**
   * End whatever is keeping the dialer busy.
   *
   * The button also shows while a call is up, which the agent reaches by
   * coming back here from the call page. A connected call has to be hung up
   * through call control; cancelling the outdial only reaches a destination
   * that has not answered yet.
   */
  @delegate('server')
  async hangup(): Promise<void> {
    const sessionId = this.cxCall.currentCall?.session?.sessionId;
    if (sessionId) {
      await this.cxActiveCallControl.hangUp(sessionId);
      return;
    }
    await this.cxCall.outdialCancel();
    if (!this.cxSettings.isManualOffhook) {
      await this.cxClient.offhookTerm();
    }
  }

  /**
   * Navigate to manual dial settings page
   */
  goToManualDialSettings(): void {
    this.router.push(cxPath.manualDial());
  }

  /**
   * Get reactive UI state props for the component
   */
  getUIProps(): UIProps<CxDialerViewUIProps> {
    return {
      toNumber: this.toNumber,
      hasDialer: this.hasDialer,
      isIdle: this.isIdle,
      isOnCall: this.cxCallMonitor.isOnCall,
      isPendingDisposition: this.cxWorkingState.isPendingDisposition,
      isHostCallActive: !this._host.isCallIdle,
      directoryRecords: this.directoryRecords,
      isSearchingDirectory: this.isSearchingDirectory,
      isToNumberPhoneNumber: this.isToNumberPhoneNumber,
      showKeypad: this.showKeypad,
      matchedDirectoryName: this.matchedDirectoryName,
      dialDestinationLabel: this.dialDestinationLabel,
    };
  }

  /**
   * Get stable UI action functions for the component
   */
  getUIFunctions(): UIFunctions<CxDialerViewUIFunctions> {
    return {
      onBackspace: () => {
        this.backspaceNumber();
      },
      onDial: async () => {
        await this.dialout();
      },
      onHangup: () => {
        this.hangup();
      },
      onInputChange: (value: string) => {
        this.setToNumber(value);
      },
      onKeypadPress: (key: string) => {
        this.appendToNumber(key);
      },
      onGoToSettings: () => {
        this.goToManualDialSettings();
      },
      onDialDirectoryRecord: (record: DirectoryRecord) => {
        this.dialDirectoryRecord(record);
      },
    };
  }

  component(_props?: CxDialerViewProps) {
    const { t } = useLocale(i18n);
    const { current: uiFunctions } = useRef(this.getUIFunctions());

    const {
      toNumber,
      hasDialer,
      isIdle,
      isOnCall,
      isPendingDisposition,
      isHostCallActive,
      directoryRecords,
      isSearchingDirectory,
      isToNumberPhoneNumber,
      showKeypad,
      matchedDirectoryName,
      dialDestinationLabel,
    } = useConnector(() => this.getUIProps());

    if (!hasDialer) {
      return null;
    }

    if (isPendingDisposition || !isIdle || isOnCall || isHostCallActive) {
      return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-neutral-base p-4">
          <div className="flex-1 flex flex-col justify-center items-center">
            {isPendingDisposition ? (
              <p
                className="typography-descriptor text-neutral-b2 text-center"
                data-sign="callBusyTip"
              >
                {t('pendingDispositionTip')}
              </p>
            ) : isHostCallActive ? (
              <p
                className="typography-descriptor text-neutral-b2 text-center"
                data-sign="callBusyTip"
              >
                {t('rcCallInProgressTip')}
              </p>
            ) : (
              <>
                <p
                  className="typography-descriptor text-neutral-b2 text-center"
                  data-sign="callBusyTip"
                >
                  {t('callInProgressTip')}
                </p>
                <div className="flex justify-center mt-4">
                  <Button
                    size="large"
                    onClick={uiFunctions.onHangup}
                    data-sign="hangupButton"
                    color="danger"
                  >
                    {t('hangupButton')}
                  </Button>
                </div>
              </>
            )}
          </div>
          {this._renderSettingsLink(t, uiFunctions)}
        </div>
      );
    }

    const hasInput = !!toNumber;

    return (
      // `flex-1 min-h-0`, not `h-full`: SyncTabView's TabContext renders no DOM
      // node, so this is a direct flex child of AppView's column alongside the
      // header nav and the tab bar. Claiming 100% height there overflows the
      // column by the height of those siblings and pushes the settings link
      // out of view. Filling the remaining space instead lets the keypad
      // region absorb the difference.
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-neutral-base">
        <div className="px-4 pt-2 [&_input]:text-center flex justify-center">
          <DialTextField
            value={toNumber}
            onChange={uiFunctions.onInputChange}
            placeholder={t('enterNumber')}
            inputProps={{
              'data-sign': 'dialerInput',
            }}
            startAdornment={
              hasInput && (
                <IconButton
                  symbol={BackspaceMd}
                  size="large"
                  variant="icon"
                  className="invisible pointer-events-none"
                />
              )
            }
            endAdornment={
              hasInput && (
                <IconButton
                  symbol={BackspaceMd}
                  size="large"
                  variant="icon"
                  onClick={uiFunctions.onBackspace}
                  data-sign="backspaceButton"
                />
              )
            }
          />
        </div>
        {/* Fixed chrome, outside both panels below. Reserved whether or not
            there is anything to say: the keypad takes the remaining height, so
            rendering this row conditionally would resize the pad the moment the
            status appears, and it has to sit above the result list too, which
            is otherwise the one place a name search gives no progress signal.
            A matched member's name takes precedence over the progress text: it
            is the answer the search was running for, and on the keypad it is
            the only place an entered extension is identified. */}
        <div className="h-4 flex-shrink-0 px-4 text-center leading-4">
          {hasInput && (matchedDirectoryName || isSearchingDirectory) && (
            <span
              className="typography-descriptor text-neutral-b2"
              data-sign="directoryStatus"
            >
              {matchedDirectoryName || t('searchingDirectory')}
            </span>
          )}
        </div>
        {showKeypad ? (
          <>
            {/* Keypad + call button block, matching micro-phone's DialerPage:
                a fixed `size="medium"` pad (200x248, 56px keys) whose `gap-y-2`
                replaces the pad's default percentage `gap`. The fixed row gap
                matters beyond spacing -- a percentage row-gap resolves against
                the pad's own height, so it only stays self-consistent while
                nothing constrains that height.
                Two deliberate departures from the reference:
                - `min-h-0 overflow-y-auto`, because this panel is shorter than
                  micro-phone's. The block is a fixed 312px and scrolls here
                  rather than pushing the settings link out of the tab.
                - no `<Dialer>` wrapper, and an explicit `onChange`. That
                  context auto-inserts keys into the DialTextField, which would
                  route keypad presses through onInputChange and trigger a
                  directory search. Keeping the two paths separate is what
                  makes keypad input skip the search. */}
            <main
              className="px-10 pb-2 flex flex-col items-center flex-auto min-h-0 overflow-y-auto"
              data-sign="dialerKeypad"
            >
              <DialPad
                size="medium"
                className="gap-y-2"
                onChange={uiFunctions.onKeypadPress}
                sounds={DialerPadSoundsMPEG}
                data-sign="dialerDialPad"
              />
              <div className="flex justify-center items-center pt-2">
                <CallButton
                  variant="start"
                  size="medium"
                  onClick={uiFunctions.onDial}
                  data-sign="callButton"
                  TooltipProps={{
                    title: dialDestinationLabel
                      ? t('callNumberTip', { destination: dialDestinationLabel })
                      : t('callButton'),
                  }}
                />
              </div>
            </main>
          </>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto mt-2">
            {/* Only typed input gets here, and it has hidden the keypad along
                with the call button, so the raw number needs a row of its own
                to stay dialable */}
            {isToNumberPhoneNumber && (
              <ListItem
                size="large"
                onClick={uiFunctions.onDial}
                data-sign="requestACall"
                hoverActions={<IconButton symbol={EnterMd} variant="icon" />}
                alwaysShowHoverActions
              >
                <ListItemText
                  primary={t('requestACall')}
                  secondary={toNumber}
                />
              </ListItem>
            )}
            {/* Typing hands this panel the whole area before any result
                arrives, so the header only appears once it has rows under it */}
            {directoryRecords.length > 0 && (
              <div
                className="typography-label uppercase text-neutral-b3 px-4 pt-3 pb-1"
                data-sign="corporateDirectoryHeader"
              >
                {t('corporateDirectory')}
              </div>
            )}
            {directoryRecords.map((record) => (
              <ListItem
                key={record.id}
                size="large"
                onClick={() => uiFunctions.onDialDirectoryRecord(record)}
                data-sign="directoryRecord"
              >
                <ListItemText
                  primary={this._formatRecordName(record)}
                  secondary={`Ext. ${record.extensionNumber}`}
                />
              </ListItem>
            ))}
            {/* A name that matched nothing offers neither a raw-number row nor
                results, which would otherwise leave the panel blank */}
            {!isToNumberPhoneNumber &&
              directoryRecords.length === 0 &&
              !isSearchingDirectory && (
                <p
                  className="typography-descriptor text-neutral-b2 text-center pt-4"
                  data-sign="noDirectoryResults"
                >
                  {t('noDirectoryResults')}
                </p>
              )}
          </div>
        )}
        {this._renderSettingsLink(t, uiFunctions)}
      </div>
    );
  }

  /**
   * Build a display name for a directory record
   */
  private _formatRecordName(record: DirectoryRecord): string {
    return formatDirectoryRecordName(record);
  }

  /**
   * Render the bottom manual dial settings link
   */
  private _renderSettingsLink(
    t: (key: I18nKey) => string,
    uiFunctions: UIFunctions<CxDialerViewUIFunctions>,
  ) {
    return (
      <div className="text-center py-0.5 flex-shrink-0">
        <Link
          onClick={uiFunctions.onGoToSettings}
          data-sign="manualDialSettings"
          className="typography-descriptor"
        >
          {t('manualDialSettings')}
        </Link>
      </div>
    );
  }
}

export { CxDialerView };
