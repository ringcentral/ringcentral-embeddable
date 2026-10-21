import type { CxBusyStateResult } from './RingCX.interface';

const NEW_CALL_HANDLING_FEATURE = 'NewCallHandlingAndForwarding';
const EDIT_ANSWERING_RULES_FEATURE = 'EditExtensionAnsweringRules';
// The platform returns `isNewBackendAvailable`; the RingCX busy state wiki
// spells it `isNewBackendAvaliable`, so both are accepted.
const NEW_BACKEND_PARAMS = ['isNewBackendAvailable', 'isNewBackendAvaliable'];

/** The part of a `/features` record this check reads. */
interface FeatureInfo {
  available?: boolean;
  params?: { name?: string; value?: string }[];
}

interface PlatformClient {
  service: {
    platform(): {
      send(options: {
        method: string;
        url: string;
        body?: unknown;
      }): Promise<unknown>;
    };
  };
}

/**
 * Whether the extension runs on the call handling backend that has comm
 * handling states. RingCX sets its busy state only there.
 */
const hasCommHandlingStates = (
  features: Record<string, FeatureInfo>,
): boolean => {
  const feature = features[NEW_CALL_HANDLING_FEATURE];
  return Boolean(
    feature?.available &&
      feature.params?.some(
        (param) =>
          !!param.name &&
          NEW_BACKEND_PARAMS.includes(param.name) &&
          param.value === 'true',
      ),
  );
};

/**
 * Whether the user may turn off the busy state: true when the account has no
 * busy state to turn off, or when the user may edit their own call handling,
 * which the comm handling states API requires.
 */
export const canDisableCxBusyState = (
  features: Record<string, FeatureInfo>,
): boolean =>
  !hasCommHandlingStates(features) ||
  Boolean(features[EDIT_ANSWERING_RULES_FEATURE]?.available);

/**
 * Turns off the RingEX `busy` comm handling state.
 *
 * While the agent is on a CX call, RingCX enables this state (single call
 * mode), and RingEX then sends incoming calls to voicemail. A CX call
 * transferred to the agent's own extension would go there too. RingCX
 * re-enables the state on the next CX call by itself.
 *
 * Without new call handling, RingCX only sets the presence to "Busy", which
 * does not stop calls ringing, so there is nothing to turn off.
 */
export const disableCxBusyState = async ({
  client,
  features,
  accountId,
  extensionId,
}: {
  client: PlatformClient;
  features: Record<string, FeatureInfo>;
  accountId: string;
  extensionId: string;
}): Promise<CxBusyStateResult> => {
  if (!hasCommHandlingStates(features)) {
    return 'notApplicable';
  }
  if (!canDisableCxBusyState(features)) {
    return 'failed';
  }
  try {
    await client.service.platform().send({
      method: 'PATCH',
      url: `/restapi/v2/accounts/${accountId}/extensions/${extensionId}/comm-handling/states/busy`,
      body: { id: 'busy', enabled: false },
    });
    return 'disabled';
  } catch (error) {
    console.error('[CxBusyState] Failed to disable busy state', error);
    return 'failed';
  }
};
