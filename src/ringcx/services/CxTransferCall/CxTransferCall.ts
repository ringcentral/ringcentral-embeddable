import { Locale, Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  action,
  computed,
  injectable,
  optional,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';
import { EventEmitter } from 'events';

import type { CxTransferType, TransferStatus } from '../../enums';
import {
  transferTypes,
  transferStatuses,
  transferEvents,
  transferErrors,
  directTransferStatues,
  directTransferTypes,
} from '../../enums';
import { parseNumber } from '../../lib/parseNumber';
import {
  findAvailableCountry,
  formatCountryE164,
  parseNumberCountry,
} from '../../lib/availableCountry';
import { checkCountryCode } from '../../lib/checkCountryCode';
import { CxTypeError } from '../../lib/CxTypeError';
import { CxClient } from '../CxClient';
import { CxCallbackTypes } from '../CxClient/enums';
import type { CxDirectAgentTransferResponse } from '../CxClient/interfaces';
import { CxAuth } from '../CxAuth';
import { CxCall } from '../CxCall';
import { CxActiveCallControl } from '../CxActiveCallControl';
import { CxWorkingState } from '../CxWorkingState';
import { CxSubscription } from '../CxSubscription';
import { CxAgentSession } from '../CxAgentSession';
import type {
  CxTransferCallOptions,
  CxTransferPhoneBookItem,
  CxDirectAgentListItem,
  CxReceivedTransferCall,
  TransferCallParams,
} from './CxTransferCall.interface';

/**
 * countryId for a destination that is not a dialable phone number.
 *
 * `evAuth.availableCountries` always contains USA, so this reliably takes the
 * domestic branch in warm/coldTransferCall. A country left over from an earlier
 * manual-entry transfer would otherwise push the destination into
 * warmTransferIntlCall (throws) or coldTransferIntlCall (silently no-ops).
 */
const NON_PHONE_DEST_COUNTRY_ID = 'USA';

/**
 * CxTransferCall module - Call transfer management
 * Handles warm/cold transfer, internal transfer, and phone book transfers
 */
@injectable({
  name: 'CxTransferCall',
})
class CxTransferCall extends RcModule {
  private _eventEmitter = new EventEmitter();
  private _transferDest: string | null = null;

  constructor(
    private cxClient: CxClient,
    private cxAuth: CxAuth,
    private cxCall: CxCall,
    private cxActiveCallControl: CxActiveCallControl,
    private cxWorkingState: CxWorkingState,
    private cxSubscription: CxSubscription,
    private cxAgentSession: CxAgentSession,
    private toast: Toast,
    private locale: Locale,
    private storagePlugin: StoragePlugin,
    @optional('CxTransferCallOptions')
    private cxTransferCallOptions?: CxTransferCallOptions,
  ) {
    super();
    this.storagePlugin.enable(this);
  }

  @storage
  @state
  receivedCall: CxReceivedTransferCall | null = null;

  @storage
  @state
  isTransferCancelable = false;

  @storage
  @state
  transferStatus: TransferStatus = transferStatuses.idle;

  @storage
  @state
  transferType: CxTransferType = transferTypes.phoneBook;

  @storage
  @state
  transferAgentId: string | null = null;

  @storage
  @state
  transferAgentList: CxDirectAgentListItem[] = [];

  @storage
  @state
  transferPhoneBookSelectedIndex: number | null = null;

  @storage
  @state
  transferRecipientNumber = '';

  /**
   * Whether `transferRecipientNumber` is already a fully-qualified EV
   * destination rather than a phone number -- a corporate directory pick is
   * `<mainNumber>*<ext>@RC_EXT`, which `parseNumber` rejects for the `*` and
   * `@`. Persisted alongside the number itself so a reload cannot leave the
   * number set with the flag lost and send it through the parser.
   */
  @storage
  @state
  transferRecipientSkipParse = false;

  @storage
  @state
  transferRecipientCountryId = 'USA';

  @storage
  @state
  stayOnCall = true;

  get transferring(): boolean {
    return this.transferStatus === transferStatuses.loading;
  }

  get allowManualInternationalTransfer(): boolean {
    return this.cxCall.currentCall?.allowManualInternationalTransfer || false;
  }

  get allowInternalTransfer(): boolean {
    return this.cxCall.currentCall?.allowDirectAgentTransfer !== '0';
  }

  get isInternalTransfer(): boolean {
    return this.transferType === transferTypes.internal;
  }

  @computed((that: CxTransferCall) => [
    that.cxCall.currentCall,
    that.cxAuth.availableCountries,
  ])
  get transferPhoneBook(): CxTransferPhoneBookItem[] {
    const currentCall = this.cxCall.currentCall;
    if (!currentCall?.transferPhoneBook) {
      return [];
    }
    return currentCall.transferPhoneBook.reduce<CxTransferPhoneBookItem[]>(
      (prev, bookItem, index) => {
        const { countryId: itemCountryId, destination, name } = bookItem;
        // the country of the number itself also carries the dialing code, the
        // only reliable way to match a country id that is not ISO alpha-3
        const numberCountry = parseNumberCountry(destination);
        const country = findAvailableCountry(this.cxAuth.availableCountries, {
          countryId: itemCountryId || numberCountry?.countryId,
          countryCode: numberCountry?.countryCode,
        });
        if (!country) {
          return prev;
        }
        // the transfer APIs expect the id of the agent config, not the ISO one
        const countryId = country.countryId;
        let parsedDestination = '';
        try {
          parsedDestination = formatCountryE164(destination, country);
        } catch (e) {
          // ignore
        }
        const countryName =
          countryId !== 'USA' ? country.countryName || countryId : '';
        const phoneBookName = `${name} ${countryName}`;
        prev.push({
          ...bookItem,
          countryId,
          phoneBookName,
          parsedDestination,
          phoneBookItemIndex: index,
        });
        return prev;
      },
      [],
    );
  }

  @action
  setReceivedCall(data: CxReceivedTransferCall | null) {
    this.receivedCall = data;
  }

  @action
  setCancelableTransfer(cancelable: boolean) {
    this.isTransferCancelable = cancelable;
  }

  @action
  resetTransferStatus() {
    this.receivedCall = null;
    this.transferType = transferTypes.phoneBook;
    this.transferAgentId = null;
    this.transferAgentList = [];
    this.transferPhoneBookSelectedIndex = null;
    this.transferRecipientNumber = '';
    this.transferRecipientSkipParse = false;
    this.transferRecipientCountryId = 'USA';
    this.stayOnCall = true;
    this.isTransferCancelable = false;
    this._transferDest = null;
  }

  @action
  changeStayOnCall(value: boolean) {
    this.stayOnCall = !value;
  }

  @action
  changeRecipientCountryId(countryId: string) {
    this.transferRecipientCountryId = countryId;
  }

  @action
  changeTransferType(type: CxTransferType) {
    this.transferType = type;
  }

  @action
  changeAgentList(data: CxDirectAgentListItem[]) {
    const currentAgent = data.find(
      ({ agentId }) => agentId === this.transferAgentId,
    );
    if (!currentAgent) {
      this.transferAgentId = null;
    }
    this.transferAgentList = data;
  }

  /**
   * Set the manual-entry recipient. `skipParse` is written here rather than
   * through its own setter so the number and the flag can never disagree: any
   * caller that sets a plain phone number also clears the flag.
   */
  @action
  changeRecipientNumber(
    phoneNumber: string,
    options?: { skipParse?: boolean },
  ) {
    this.transferRecipientNumber = phoneNumber;
    this.transferRecipientSkipParse = !!options?.skipParse;
  }

  @action
  changeTransferPhoneBookSelected(index: number | null) {
    this.transferPhoneBookSelectedIndex = index;
  }

  @action
  changeTransferAgentId(agentId: string) {
    this.transferAgentId = agentId;
  }

  @action
  setTransferStatus(status: TransferStatus) {
    this.transferStatus = status;
  }

  /**
   * Parse manual entry number with country code check
   */
  parseManualEntryNumber(): TransferCallParams {
    if (!this.transferRecipientNumber) {
      throw new CxTypeError({
        type: transferErrors.RECIPIENT_NUMBER_ERROR,
        data: `Abnormal Transfer: this.transferRecipientNumber -> ${this.transferRecipientNumber}`,
      });
    }
    if (this.transferRecipientSkipParse) {
      return {
        dialDest: this.transferRecipientNumber,
        countryId: NON_PHONE_DEST_COUNTRY_ID,
      };
    }
    checkCountryCode(this.transferRecipientNumber, this.cxAuth.availableCountries);
    const toNumber = parseNumber(this.transferRecipientNumber);
    return { dialDest: toNumber, countryId: this.transferRecipientCountryId };
  }

  /**
   * Parse phone book number with country code check
   */
  parsePhoneBookNumber(): TransferCallParams {
    if (this.transferPhoneBookSelectedIndex === null) {
      throw new CxTypeError({
        type: transferErrors.CONTACT_ID_ERROR,
        data: `Abnormal Transfer: this.transferPhoneBookSelected -> ${this.transferPhoneBookSelectedIndex}`,
      });
    }
    const transferPhoneBookSelected =
      this.transferPhoneBook[this.transferPhoneBookSelectedIndex];
    checkCountryCode(transferPhoneBookSelected.destination, this.cxAuth.availableCountries);
    const toNumber = parseNumber(transferPhoneBookSelected.destination);
    return { dialDest: toNumber, countryId: transferPhoneBookSelected.countryId };
  }

  /**
   * Warm transfer call with international support
   */
  async warmTransferCall({ dialDest, countryId }: TransferCallParams): Promise<void> {
    const country = findAvailableCountry(this.cxAuth.availableCountries, {
      countryId,
    });
    if (!country && !this.allowManualInternationalTransfer) {
      throw new Error('Unexpected Error: ban transferring international call');
    }
    // Held only once the destination is known to be dialable, so a transfer
    // this module refuses to send never leaves the customer on hold.
    await this._holdBeforeWarmTransfer();
    this._transferDest = dialDest;
    if (!country) {
      await this.cxClient.warmTransferIntlCall({
        dialDest,
        countryId,
      });
    } else {
      await this.cxClient.warmTransferCall({ dialDest });
    }
  }

  /**
   * Cold transfer call with international support
   */
  async coldTransferCall({ dialDest, countryId }: TransferCallParams): Promise<void> {
    const country = findAvailableCountry(this.cxAuth.availableCountries, {
      countryId,
    });
    if (!country) {
      if (this.allowManualInternationalTransfer) {
        await this.cxClient.coldTransferIntlCall({
          dialDest,
          countryId,
        });
      } else {
        // Ban transferring international call
      }
    } else {
      await this.cxClient.coldTransferCall({ dialDest });
    }
  }

  /**
   * Put the customer on hold before a warm transfer opens the consult leg,
   * when the account asks for it, so they do not hear the agent talk to the
   * transfer target. Same rule as eag, which holds on `allowWarmXferOnHold`
   * for both a destination (`CallService.warmXfer`) and a direct agent
   * (`CallService.directAgentTransfer`).
   *
   * The hold is awaited rather than fired alongside the transfer: it has to be
   * in place before the consult leg opens, and a hold the server rejects
   * aborts the transfer instead of transferring un-held.
   */
  private async _holdBeforeWarmTransfer(): Promise<void> {
    if (!this.cxAuth.agentPermissions?.allowWarmXferOnHold) return;
    // Holding an already held call would only be answered with an error.
    // `isHold` is what the app writes on the call; `hold` is the raw SDK field.
    const currentCall = this.cxCall.currentCall as
      | { isHold?: boolean; hold?: boolean }
      | null;
    if (currentCall?.isHold || currentCall?.hold) return;
    await this.cxActiveCallControl.holdAndConfirm();
  }

  async fetchAgentList(): Promise<void> {
    let data;
    try {
      const result = await this.cxClient.fetchDirectAgentList();
      if (result) {
        data = result.agents;
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (Array.isArray(data)) {
        this.changeAgentList(data);
      }
    }
  }

  /**
   * Parse number based on current transfer type.
   * Dispatches to parseManualEntryNumber or parsePhoneBookNumber.
   */
  parseNumber(): TransferCallParams | undefined {
    switch (this.transferType) {
      case transferTypes.phoneBook:
        return this.parsePhoneBookNumber();
      case transferTypes.manualEntry:
        return this.parseManualEntryNumber();
      default:
        return undefined;
    }
  }

  /**
   * Get the raw destination number for the current transfer type.
   */
  getNumber(): string {
    switch (this.transferType) {
      case transferTypes.phoneBook:
        return this.transferPhoneBook[this.transferPhoneBookSelectedIndex!]
          ?.destination ?? '';
      case transferTypes.manualEntry:
        return this.transferRecipientNumber;
      default:
        return '';
    }
  }

  /**
   * Route a transfer call as warm or cold based on stayOnCall setting.
   */
  async transferCall({ dialDest, countryId }: TransferCallParams): Promise<void> {
    if (this.stayOnCall) {
      await this.warmTransferCall({ dialDest, countryId });
    } else {
      await this.coldTransferCall({ dialDest, countryId });
    }
  }

  /**
   * Perform an internal (direct agent) transfer, warm or cold based on stayOnCall.
   */
  async internalTransferCall(): Promise<void> {
    if (!this.transferAgentId) {
      throw new CxTypeError({
        type: transferErrors.AGENT_ID_ERROR,
        data: `Abnormal Transfer: this.transferAgentId -> ${this.transferAgentId}`,
      });
    }
    try {
      await this.fetchAgentList();
    } catch (e) {
      console.warn('fetch agent list error');
      console.error(e);
    }
    if (this.stayOnCall) {
      await this._holdBeforeWarmTransfer();
      await this.cxClient.warmDirectAgentTransfer(this.transferAgentId);
    } else {
      await this.cxClient.coldDirectAgentTransfer(this.transferAgentId);
    }
  }

  /**
   * Orchestrate the full transfer flow: parse number, set status, dispatch by type.
   */
  async transfer(): Promise<void> {
    try {
      const parsed = this.parseNumber();
      this._eventEmitter.emit(transferEvents.START);
      this.setTransferStatus(transferStatuses.loading);
      switch (this.transferType) {
        case transferTypes.internal:
          await this.internalTransferCall();
          break;
        case transferTypes.phoneBook:
        case transferTypes.manualEntry:
          if (!parsed) {
            throw new CxTypeError({
              type: transferErrors.TYPE_ERROR,
              data: `Abnormal Transfer: failed to parse number for type ${this.transferType}`,
            });
          }
          await this.transferCall(parsed);
          break;
        default:
          throw new CxTypeError({
            type: transferErrors.TYPE_ERROR,
            data: `Abnormal Transfer: this.transferType -> ${this.transferType}`,
          });
      }
      this._eventEmitter.emit(transferEvents.SUCCESS);
    } catch (e) {
      this._eventEmitter.emit(transferEvents.ERROR, e);
      throw e;
    } finally {
      this.setTransferStatus(transferStatuses.idle);
      this._eventEmitter.emit(transferEvents.END);
    }
  }

  rejectTransferCall(): void {
    if (!this.receivedCall) return;
    this.cxClient.rejectDirectAgentTransferCall(this.receivedCall.uii);
    this.setReceivedCall(null);
  }

  acceptTransferCall(): void {
    if (!this.receivedCall) return;
    this.cxWorkingState.setWorkingStateWorking();
    setTimeout(() => this.setReceivedCall(null), 6000);
  }

  onTransferStart(handler: () => void): void {
    this._eventEmitter.on(transferEvents.START, handler);
  }

  onTransferEnd(handler: () => void): void {
    this._eventEmitter.on(transferEvents.END, handler);
  }

  onTransferError(handler: (error: any) => void): void {
    this._eventEmitter.on(transferEvents.ERROR, handler);
  }

  onTransferSuccess(handler: () => void): void {
    this._eventEmitter.on(transferEvents.SUCCESS, handler);
  }

  /**
   * Arm the unhold when a warm transfer to an agent completes and the account
   * asks for it, so leaving the consult leg brings the customer back. Same as
   * eag, which sets `unholdOnHangup` on a WARM/SUCCEEDED direct agent transfer
   * and unholds from `CallService.hangup`.
   */
  private _handleDirectAgentTransferResponse(
    data?: CxDirectAgentTransferResponse,
  ): void {
    if (
      data?.type !== directTransferTypes.WARM ||
      data.status !== directTransferStatues.SUCCEEDED ||
      !this.cxAuth.agentPermissions?.allowWarmXferAutoUnhold
    ) {
      return;
    }
    this.cxActiveCallControl.setUnholdOnHangup(true);
  }

  override onInitOnce() {
    this.cxAgentSession.onTriggerConfig(() => {
      this.setTransferStatus(transferStatuses.idle);
    });
    this.cxSubscription
      .subscribe(CxCallbackTypes.DIRECT_AGENT_TRANSFER, (data) => {
        this._handleDirectAgentTransferResponse(data);
      })
      // The call ending is not the agent leaving a consult leg: there is
      // nothing left to take off hold, and the armed unhold must not survive
      // into the next call.
      .subscribe(CxCallbackTypes.END_CALL, () => {
        this.cxActiveCallControl.setUnholdOnHangup(false);
      });
  }
}

export { CxTransferCall };
