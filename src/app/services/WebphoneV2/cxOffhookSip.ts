import { getHeader } from './WebphoneV2Session';

export const ENGAGE_AGENT_EPT_ROLE = 'rc-engage-agent-ept';
/**
 * Identifies this app instance to the SIP edge. Every REGISTER carries it, not
 * only Engage ones, so the edge can tell this browser apart from another
 * instance of the same extension.
 */
export const ENDPOINT_ID_REGISTER_HEADER_NAME = 'P-rc-endpoint-id';
export const ENGAGE_AGENT_EPT_REGISTER_HEADER_NAMES = [
  'P-RC-Supported-Ept-Roles',
  ENDPOINT_ID_REGISTER_HEADER_NAME,
] as const;

/**
 * Header names confirmed on a live ringcentral-web-phone-v2 offhook INVITE.
 * SIP comparison is case-insensitive; the wire names are lowercase `p-rc-*`.
 */
export const CX_OFFHOOK_INVITE_HEADERS = {
  agentMode: 'p-rc-rcx-agent-mode',
  requiredEptRoles: 'p-rc-required-ept-roles',
  callSource: 'p-rc-call-source',
  destination: 'p-rc-destination',
  sessionId: 'p-rc-session-id',
  callControlApiIds: 'p-rc-api-ids',
} as const;

const OFFHOOK_AGENT_MODE = 'offhook';
const PARTNER_CONTACT_CENTER_SOURCE = 'partner-contact-center';
const EV_AGENT_DESTINATION = 'ev-agent';

export const getEngageAgentEptRegisterHeaders = (
  endpointId: string,
): Record<string, string> => ({
  'P-RC-Supported-Ept-Roles': ENGAGE_AGENT_EPT_ROLE,
  [ENDPOINT_ID_REGISTER_HEADER_NAME]: endpointId,
});

export const isRegisterSipMessage = (message: unknown): boolean => {
  const subject = (message as { subject?: unknown })?.subject;
  return (
    typeof subject === 'string' && subject.toUpperCase().startsWith('REGISTER ')
  );
};

const assignRegisterHeaders = (
  message: unknown,
  headers: Record<string, string>,
): void => {
  const sipMessage = message as { headers?: Record<string, string> };
  if (!sipMessage.headers) {
    sipMessage.headers = {};
  }
  Object.assign(sipMessage.headers, headers);
};

export const applyEndpointIdRegisterHeader = (
  message: unknown,
  endpointId: string,
): void => {
  if (!message || !endpointId) {
    return;
  }
  assignRegisterHeaders(message, {
    [ENDPOINT_ID_REGISTER_HEADER_NAME]: endpointId,
  });
};

export const applyEngageAgentEptRegisterHeaders = (
  message: unknown,
  endpointId: string,
): void => {
  if (!message || !endpointId) {
    return;
  }
  assignRegisterHeaders(message, getEngageAgentEptRegisterHeaders(endpointId));
};

const includesIgnoreCase = (
  value: string | undefined,
  expected: string,
): boolean => Boolean(value?.toLowerCase().includes(expected.toLowerCase()));

export const isCxOffhookInvite = (message: unknown): boolean => {
  if (!message) {
    return false;
  }
  const agentMode = getHeader(message, CX_OFFHOOK_INVITE_HEADERS.agentMode);
  if (includesIgnoreCase(agentMode, OFFHOOK_AGENT_MODE)) {
    return true;
  }
  const requiredRoles = getHeader(
    message,
    CX_OFFHOOK_INVITE_HEADERS.requiredEptRoles,
  );
  if (includesIgnoreCase(requiredRoles, ENGAGE_AGENT_EPT_ROLE)) {
    return true;
  }
  const destination = getHeader(message, CX_OFFHOOK_INVITE_HEADERS.destination);
  if (destination?.toLowerCase() === EV_AGENT_DESTINATION) {
    return true;
  }
  const callSource = getHeader(message, CX_OFFHOOK_INVITE_HEADERS.callSource);
  return (
    includesIgnoreCase(callSource, PARTNER_CONTACT_CENTER_SOURCE) &&
    includesIgnoreCase(requiredRoles, ENGAGE_AGENT_EPT_ROLE)
  );
};

export const listSipHeaderNames = (message: unknown): readonly string[] => {
  const headers = (message as { headers?: Record<string, unknown> })?.headers;
  if (!headers) {
    return [];
  }
  return Object.keys(headers);
};
