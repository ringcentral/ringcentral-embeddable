import {
  injectable,
  PortManager,
  RcModule,
} from '@ringcentral-integration/next-core';

import {
  claimRoleCompat,
  isLocalRoleOwner,
  RoleStateMirror,
} from '../../../lib/roleCompat';

/**
 * Tracks which browser client the user most recently interacted with.
 *
 * `autoElect` lets the coordinator pick a holder when nobody has claimed the
 * role yet (for example on the very first inbound call, before any click), so
 * there is always a target for call audio and ringtone.
 */
export const lastInteractedClientRole = {
  role: 'lastInteractedClient',
  allowMultiple: false,
  autoElect: true,
} as const;

const interactionEvents = ['pointerdown', 'click', 'keydown'] as const;

/**
 * Claims {@link lastInteractedClientRole} for this tab on real user input.
 *
 * The webphone runs in the SharedWorker, so it has no notion of which tab the
 * user is looking at. This module supplies that: whichever tab last saw a
 * trusted interaction becomes the preferred destination for the media bridge
 * and for the ringtone.
 */
@injectable({
  name: 'ClientInteraction',
})
export class ClientInteraction extends RcModule {
  private _claimPromise?: Promise<void>;

  private _roleState?: RoleStateMirror;

  constructor(protected _portManager: PortManager) {
    super();
    this._portManager.onClient(() => {
      this._roleState = new RoleStateMirror(
        this._portManager,
        lastInteractedClientRole.role,
      );
      for (const eventName of interactionEvents) {
        globalThis.addEventListener(eventName, this._onInteraction, true);
      }
      return () => {
        for (const eventName of interactionEvents) {
          globalThis.removeEventListener(eventName, this._onInteraction, true);
        }
        this._roleState?.dispose();
        this._roleState = undefined;
        this._claimPromise = undefined;
      };
    });
  }

  get isLastInteractedClient() {
    if (!this._portManager.isClient) return false;
    return isLocalRoleOwner(this._portManager, this._roleState?.state);
  }

  /** Ensures this browser client is the current interaction owner. */
  ensureCurrentClient(): Promise<void> {
    if (!this._portManager.isClient || this.isLastInteractedClient) {
      return Promise.resolve();
    }
    if (!this._claimPromise) {
      const claimPromise = claimRoleCompat(
        this._portManager,
        lastInteractedClientRole,
      )
        .then(() => undefined)
        .finally(() => {
          if (this._claimPromise === claimPromise) {
            this._claimPromise = undefined;
          }
        });
      this._claimPromise = claimPromise;
    }
    return this._claimPromise;
  }

  private _onInteraction = (event: Event) => {
    // Untrusted events are ignored so page scripts cannot steal call audio.
    if (!event.isTrusted || this.isLastInteractedClient || this._claimPromise) {
      return;
    }

    this.logger.debug('trusted interaction observed', {
      clientId: this._portManager.clientId,
      eventType: event.type,
    });
    void this.ensureCurrentClient().catch((error) => {
      this.logger.warn('lastInteractedClient claim failed', {
        clientId: this._portManager.clientId,
        error,
      });
    });
  };
}
