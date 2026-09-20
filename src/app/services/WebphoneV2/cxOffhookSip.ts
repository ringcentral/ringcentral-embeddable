import { getHeader } from './WebphoneV2Session';

export const ENGAGE_AGENT_EPT_ROLE = 'rc-engage-agent-ept';
const OFFHOOK_AGENT_MODE = 'offhook';
const PARTNER_CONTACT_CENTER_SOURCE = 'partner-contact-center';
const EV_AGENT_DESTINATION = 'ev-agent';

export const getEngageAgentEptRegisterHeaders = (
  endpointId: string,
): Record<string, string> => ({
  'P-RC-Supported-Ept-Roles': ENGAGE_AGENT_EPT_ROLE,
  'P-rc-endpoint-id': endpointId,
});

export const isRegisterSipMessage = (message: unknown): boolean => {
  const subject = (message as { subject?: unknown })?.subject;
  return (
    typeof subject === 'string' && subject.toUpperCase().startsWith('REGISTER ')
  );
};

export const applyEngageAgentEptRegisterHeaders = (
  message: unknown,
  endpointId: string,
): void => {
  const headers = (message as { headers?: Record<string, string> }).headers;
  if (!headers || !endpointId) {
    return;
  }
  Object.assign(headers, getEngageAgentEptRegisterHeaders(endpointId));
};

const includesIgnoreCase = (
  value: string | undefined,
  expected: string,
): boolean => Boolean(value?.toLowerCase().includes(expected.toLowerCase()));

export const isCxOffhookInvite = (message: unknown): boolean => {
  if (!message) {
    return false;
  }
  const agentMode = getHeader(message, 'p-rc-rcx-agent-mode');
  if (includesIgnoreCase(agentMode, OFFHOOK_AGENT_MODE)) {
    return true;
  }
  const requiredRoles = getHeader(message, 'p-rc-required-ept-roles');
  if (includesIgnoreCase(requiredRoles, ENGAGE_AGENT_EPT_ROLE)) {
    return true;
  }
  const destination = getHeader(message, 'P-Rc-Destination');
  if (destination?.toLowerCase() === EV_AGENT_DESTINATION) {
    return true;
  }
  const callSource = getHeader(message, 'p-rc-call-source');
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
