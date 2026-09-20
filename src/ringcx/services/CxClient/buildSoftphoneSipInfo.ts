import type { CxSoftphoneSipInfo } from './CxClient.interface';

/** RingCentral SIP usernames read `<main number>*<extension number>`. */
const RC_SOFTPHONE_USERNAME_PATTERN = /^\+?\d+\*\d+$/;

interface ProvisionedSipInfo {
  username?: string;
  domain?: string;
}

/**
 * Translates the host webphone's `client-info/sip-provision` result into the
 * shape the Agent SDK keeps in `softphoneSettings.sipInfo`, so the SDK can
 * build the `<username>@RC_SOFTPHONE` dial destination without calling
 * `api/v1/sip/sipRegistrationInfo` itself.
 *
 * Credentials are left out on purpose: the SDK's own SIP stack must never be
 * able to register a second endpoint for this extension.
 *
 * @returns null when the provision cannot identify the extension, which leaves
 * the SDK to fetch the info the way it always has.
 */
export const buildSoftphoneSipInfo = (
  sipInfo: ProvisionedSipInfo | null | undefined,
): CxSoftphoneSipInfo[] | null => {
  const username = sipInfo?.username;
  if (!username || !RC_SOFTPHONE_USERNAME_PATTERN.test(username)) {
    return null;
  }
  return [
    {
      transport: 'WSS',
      username: username.replace(/^\+/, ''),
      username_e164: username.startsWith('+') ? username : `+${username}`,
      domain: sipInfo?.domain ?? '',
    },
  ];
};
