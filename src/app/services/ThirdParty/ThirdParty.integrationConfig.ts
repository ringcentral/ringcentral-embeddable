import type { RouteParams } from '@ringcentral-integration/micro-contacts/src/app/views';
import type { IntegrationConfigOptions } from '@ringcentral-integration/micro-setting/src/app/services';

import type { ThirdParty } from './ThirdParty';
import type { ThirdPartyContact } from './ThirdParty.interface';

const DEFAULT_INTEGRATION_KEY = 'thirdParty';

/**
 * The framework's own default, restated because it is not exported.
 *
 * Kept in the list so RC directory rows behave exactly as before: dropping
 * these would flip their action button from `viewEntity` to `addEntity`.
 */
const RC_DIRECTORY_ENTITY_TYPES = ['company', 'personal'];

type IntegrationConfigThirdParty = Pick<
  ThirdParty,
  | 'displayName'
  | 'sourceName'
  | 'viewMatchedContactExternal'
  | 'matchedContactEntityTypes'
  | 'onViewMatchedContactExternal'
>;

type ViewRingCentralContact = (contact: RouteParams) => Promise<void> | void;

/** Creates integration configuration backed by the registered service state. */
export function createThirdPartyIntegrationConfig(
  thirdParty: IntegrationConfigThirdParty,
  viewRingCentralContact?: ViewRingCentralContact,
): IntegrationConfigOptions {
  /**
   * Hands a record back to the registered service via its
   * `viewMatchedContactPath`.
   *
   * Only the service's own records are forwarded: an RC directory match has no
   * counterpart on the other side of the postMessage bridge.
   */
  const viewMatchedContact = (entity: unknown): Promise<void> | void => {
    const contact = entity as ThirdPartyContact | undefined;
    if (
      !contact?.id ||
      !thirdParty.viewMatchedContactExternal ||
      !thirdParty.sourceName ||
      contact.resourceType !== thirdParty.sourceName
    ) {
      return;
    }
    return thirdParty.onViewMatchedContactExternal(contact);
  };

  const viewEntity = (entity: unknown): Promise<void> | void => {
    const contact = entity as ThirdPartyContact | undefined;
    if (!contact?.id) {
      return;
    }
    if (
      contact.type &&
      RC_DIRECTORY_ENTITY_TYPES.includes(contact.type) &&
      !contact.resourceType
    ) {
      return viewRingCentralContact?.({
        id: contact.id,
        type: contact.type,
        direct: true,
      });
    }
    return viewMatchedContact(contact);
  };

  return {
    get key(): string {
      return thirdParty.sourceName ?? DEFAULT_INTEGRATION_KEY;
    },
    get name(): string | undefined {
      return thirdParty.displayName ?? thirdParty.sourceName ?? undefined;
    },
    /**
     * The service's own matched types have to be listed here or nothing
     * downstream can reach `onViewEntity`: both the clickable name in
     * `ContactDisplayRender` and the `viewEntity` action button are gated on
     * the displayed contact's type appearing in this list.
     */
    get viewableEntityTypes(): string[] {
      if (!thirdParty.viewMatchedContactExternal) {
        return RC_DIRECTORY_ENTITY_TYPES;
      }
      return [
        ...RC_DIRECTORY_ENTITY_TYPES,
        ...thirdParty.matchedContactEntityTypes,
      ];
    },
    // A "Maybe" match opens the contact its label names, the same one
    // clicking the name opens; the match picker next to it still switches.
    onViewEntity: (entity) => viewEntity(entity),
    // Enables the per-row "view record" button inside the match picker.
    viewExternalEntity: (entity) => viewEntity(entity),
    onCreateEntity: (entity) => {
      console.log('🐞 ~ onCreateEntity entity:', entity);
    },
  };
}
