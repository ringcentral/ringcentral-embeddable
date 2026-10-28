import { batchGetApi } from '@ringcentral-integration/commons/lib/batchApiHelper';
import {
  AppFeatures,
  Auth,
  Client,
} from '@ringcentral-integration/micro-auth/src/app/services';
import {
  action,
  delegate,
  injectable,
  RcModule,
  state,
  storage,
  StoragePlugin,
} from '@ringcentral-integration/next-core';

import {
  PERSONS_BATCH_DELAY_MS,
  PERSONS_BATCH_SIZE,
  TEAM_MESSAGING_API_PATH,
} from './TeamMessaging.constants';
import { chunkIds, sleep } from './TeamMessaging.helper';
import type { TeamMessagingPerson } from './TeamMessaging.interface';

/**
 * Team messaging persons, cached by id. Persons are loaded on demand, in
 * batches of 30 ids, and kept until logout.
 */
@injectable({
  name: 'TeamMessagingPersons',
})
export class TeamMessagingPersons extends RcModule {
  /** Ids being fetched, so concurrent callers don't fetch them twice. */
  private _pendingIds = new Set<string>();

  constructor(
    protected _auth: Auth,
    protected _client: Client,
    protected _appFeatures: AppFeatures,
    protected _storage: StoragePlugin,
  ) {
    super();
    this._storage.enable(this);
  }

  @storage
  @state
  personsMap: Record<string, TeamMessagingPerson> = {};

  @action
  private _savePersons(persons: TeamMessagingPerson[]): void {
    persons.forEach((person) => {
      if (person?.id) {
        this.personsMap[person.id] = person;
      }
    });
  }

  /** The signed-in user. A team messaging person id is the extension id. */
  get me(): TeamMessagingPerson | undefined {
    return this._auth.ownerId ? this.personsMap[this._auth.ownerId] : undefined;
  }

  /** Load the persons that are not cached yet. */
  @delegate('server')
  async loadPersons(ids: string[]): Promise<void> {
    if (!this._appFeatures.hasGlipPermission) {
      return;
    }
    const missingIds = Array.from(new Set(ids)).filter(
      (id) => id && !this.personsMap[id] && !this._pendingIds.has(id),
    );
    if (missingIds.length === 0) {
      return;
    }
    missingIds.forEach((id) => this._pendingIds.add(id));
    try {
      await this._fetchInBatches(missingIds);
    } finally {
      missingIds.forEach((id) => this._pendingIds.delete(id));
    }
  }

  private async _fetchInBatches(ids: string[]): Promise<void> {
    const batches = chunkIds(ids, PERSONS_BATCH_SIZE);
    for (const [index, batch] of batches.entries()) {
      if (index > 0) {
        await sleep(PERSONS_BATCH_DELAY_MS);
      }
      try {
        this._savePersons(await this._fetchPersons(batch));
      } catch (error) {
        this.logger.error('load team messaging persons failed', error);
      }
    }
  }

  private async _fetchPersons(ids: string[]): Promise<TeamMessagingPerson[]> {
    const url = `${TEAM_MESSAGING_API_PATH}/persons/${ids.join(',')}`;
    const platform = this._client.service.platform();
    if (ids.length === 1) {
      const response = await platform.get(url);
      return [(await response.json()) as TeamMessagingPerson];
    }
    const responses: Response[] = await batchGetApi({ platform, url });
    const persons = await Promise.all(
      responses
        .filter((response) => response.ok)
        .map((response) => response.json() as Promise<TeamMessagingPerson>),
    );
    return persons;
  }
}
