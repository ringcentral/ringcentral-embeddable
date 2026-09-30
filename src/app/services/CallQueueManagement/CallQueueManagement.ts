import {
  Auth,
  Client,
  track,
} from '@ringcentral-integration/micro-auth/src/app/services';
import { CallQueueManagement as CallQueueManagementBase } from '@ringcentral-integration/micro-phone/src/app/services';
import type { UpdateCallQueuePresenceParams } from '@ringcentral-integration/micro-phone/src/app/services/CallQueueManagement/CallQueueManagement.interface';
import { injectable, PortManager } from '@ringcentral-integration/next-core';

import { embeddableTrackEvents } from '../Analytics/embeddableTrackEvents';

/**
 * Tracks call queue presence updates with the legacy event.
 */
@injectable({
  name: 'CallQueueManagement',
})
export class CallQueueManagement extends CallQueueManagementBase {
  constructor(auth: Auth, client: Client, portManager: PortManager) {
    super(auth, client, portManager);
  }

  override updatePresence(
    items: UpdateCallQueuePresenceParams[],
  ): Promise<void> {
    items.forEach(({ acceptCalls }) => this._trackUpdatePresence(acceptCalls));
    return super.updatePresence(items);
  }

  @track((_that: CallQueueManagement, acceptCalls: boolean) => [
    embeddableTrackEvents.updateCallQueuePresence,
    { acceptCalls },
  ])
  private _trackUpdatePresence(_acceptCalls: boolean): void {}
}
