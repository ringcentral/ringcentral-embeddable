type RuntimeSdkConfig = {
  clientId?: string;
  clientSecret?: string;
  server?: string;
  discoveryServer?: string;
  enableDiscovery?: boolean;
  appKey?: string;
  appSecret?: string;
  apiKey?: string;
  apiSecret?: string;
  apiServer?: string;
};

type RuntimeSdkParams = {
  clientId?: string;
  clientSecret?: string;
  appServer?: string;
  discovery?: boolean;
  discoverAppServer?: string;
};

type ResolvedRuntimeSdkConfig = {
  clientId?: string;
  clientSecret?: string;
  server?: string;
  discoveryServer?: string;
  enableDiscovery?: boolean;
};

const DISCOVERY_SERVERS = new Set([
  'https://platform.ringcentral.com',
  'https://platform.devtest.ringcentral.com',
  'https://discovery.ringcentral.biz',
  'https://discovery.ringcentral.com',
  'https://platform.ringcentral.biz',
]);

function firstDefined<T>(...values: (T | undefined)[]): T | undefined {
  return values.find((value) => typeof value !== 'undefined');
}

function normalizeSdkConfig(
  config: RuntimeSdkConfig = {},
): ResolvedRuntimeSdkConfig {
  const clientId = firstDefined(config.clientId, config.appKey, config.apiKey);
  const clientSecret = firstDefined(
    config.clientSecret,
    config.appSecret,
    config.apiSecret,
  );
  const server = firstDefined(config.server, config.apiServer);

  return {
    ...(clientId && { clientId }),
    ...(clientSecret && { clientSecret }),
    ...(server && { server }),
    ...(config.discoveryServer && {
      discoveryServer: config.discoveryServer,
    }),
    ...(typeof config.enableDiscovery !== 'undefined' && {
      enableDiscovery: config.enableDiscovery,
    }),
  };
}

function isLegacyCompatibleAppServer(server?: string): server is string {
  return Boolean(
    server?.startsWith('https://') &&
      !server.includes('?') &&
      !server.includes('javascript'),
  );
}

/**
 * Resolves static and URL SDK configuration with legacy-compatible precedence
 * and validation.
 */
export function resolveRuntimeSdkConfig(
  defaultConfig: RuntimeSdkConfig | undefined,
  params: RuntimeSdkParams,
): ResolvedRuntimeSdkConfig {
  const normalizedDefault = normalizeSdkConfig(defaultConfig);
  const hasRuntimeClientId = Boolean(params.clientId);
  const clientId = params.clientId || normalizedDefault.clientId;
  const clientSecret = hasRuntimeClientId
    ? params.clientSecret
    : normalizedDefault.clientSecret;
  const server = isLegacyCompatibleAppServer(params.appServer)
    ? params.appServer
    : normalizedDefault.server;

  const discoveryRequested = Boolean(params.discovery);
  const enableDiscovery = discoveryRequested
    ? true
    : normalizedDefault.enableDiscovery;
  let discoveryServer = normalizedDefault.discoveryServer;
  if (discoveryRequested) {
    const candidate = params.discoverAppServer || server;
    discoveryServer =
      candidate && DISCOVERY_SERVERS.has(candidate)
        ? candidate
        : normalizedDefault.server;
  }

  return {
    ...(clientId && { clientId }),
    ...(clientSecret && { clientSecret }),
    ...(server && { server }),
    ...(typeof enableDiscovery !== 'undefined' && { enableDiscovery }),
    ...(discoveryServer && { discoveryServer }),
  };
}
