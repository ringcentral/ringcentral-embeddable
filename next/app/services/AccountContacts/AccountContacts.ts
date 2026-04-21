import type { IContact } from '@ringcentral-integration/commons/interfaces/Contact.model';
import {
  AccountContacts,
  type AccountContactsOptions,
} from '@ringcentral-integration/micro-contacts/src/app/services';
import {
  AccountInfo,
  AppFeatures,
  Auth,
  Client,
  ExtensionInfo,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { CompanyContacts } from '@ringcentral-integration/micro-contacts/src/app/services/CompanyContacts';
import {
  injectable,
  optional,
  PortManager,
} from '@ringcentral-integration/next-core';

const PRESENCE_BATCH_DELAY = 1000;
const MAX_BATCH_SIZE = 30;

/**
 * Extends AccountContacts to fix broken ViewableManager presence pipeline.
 *
 * The base class's ViewableManager uses @delegate('server') on a plain
 * (non-DI) class, so the link() → emit → fetch pipeline never fires.
 * This override collects presence requests from getPresenceSync and
 * batch-fetches via handlePresenceUpdate directly, with TTL-based refresh.
 */
@injectable({
  name: 'AccountContacts',
})
export class AccountContactsV2 extends AccountContacts {
  private _pendingPresenceMap = new Map<string, Set<string>>();
  private _presenceBatchTimer: ReturnType<typeof setTimeout> | null = null;
  private _presenceFetchedAt = new Map<string, number>();

  constructor(
    _auth: Auth,
    _client: Client,
    _portManager: PortManager,
    _extensionInfo: ExtensionInfo,
    _appFeatures: AppFeatures,
    _accountInfo: AccountInfo,
    _companyContacts: CompanyContacts,
    @optional('AccountContactsOptions')
    _accountContactsOptions?: AccountContactsOptions,
  ) {
    super(
      _auth,
      _client,
      _portManager,
      _extensionInfo,
      _appFeatures,
      _accountInfo,
      _companyContacts,
      _accountContactsOptions,
    );
  }

  override getPresenceSync(contact: IContact) {
    const accountId = contact.account?.id;
    const extensionId = contact.id;
    if (!accountId || !extensionId || contact.type !== 'company') return null;

    const cached = super.getPresenceSync(contact);
    const fetchedAt = this._presenceFetchedAt.get(extensionId) ?? 0;
    const expired = Date.now() - fetchedAt >= this._presenceTtl;

    if (!cached || expired) {
      let extensionIds = this._pendingPresenceMap.get(accountId);
      if (!extensionIds) {
        extensionIds = new Set();
        this._pendingPresenceMap.set(accountId, extensionIds);
      }
      extensionIds.add(extensionId);
      this._scheduleBatchFetch();
    }

    return cached;
  }

  private _scheduleBatchFetch() {
    if (this._presenceBatchTimer) return;
    this._presenceBatchTimer = setTimeout(() => {
      this._presenceBatchTimer = null;
      this._flushPendingPresence();
    }, PRESENCE_BATCH_DELAY);
  }

  private async _flushPendingPresence() {
    const pending = this._pendingPresenceMap;
    this._pendingPresenceMap = new Map();

    const distinctMap: [string, string[]][] = [];
    for (const [accountId, extensionIds] of pending) {
      const ids = Array.from(extensionIds);
      for (let i = 0; i < ids.length; i += MAX_BATCH_SIZE) {
        distinctMap.push([accountId, ids.slice(i, i + MAX_BATCH_SIZE)]);
      }
    }
    if (distinctMap.length > 0) {
      const successIds = await this.handlePresenceUpdate(distinctMap);
      const now = Date.now();
      for (const id of successIds) {
        this._presenceFetchedAt.set(id, now);
      }
    }
  }
}
