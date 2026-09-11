import {
  applyMethod,
  delegate,
  getRef,
  nameKey,
  PortManager,
} from '@ringcentral-integration/next-core';

const ACTIVE_TAB_CHANNEL_PREFIX = 'activeTab:';

function resolveChannelName(module: object): string {
  const identifier =
    getRef(module).identifier ??
    (module as { readonly [nameKey]?: string })[nameKey];

  if (!identifier?.trim()) {
    throw new Error(
      'Unable to register active-tab delegate: the module has no stable identifier. Add an @injectable({ name }) value or provide options.channelName.',
    );
  }

  return `${ACTIVE_TAB_CHANNEL_PREFIX}${identifier}`;
}

function resolveConfiguredChannelName(
  module: object,
  channelName?: string,
): string {
  if (channelName === undefined) {
    return resolveChannelName(module);
  }

  if (!channelName.trim()) {
    throw new Error(
      'Unable to register active-tab delegate: options.channelName must not be empty.',
    );
  }

  return channelName;
}

/**
 * Registers the active-tab delegation wiring for a module. Must be called once
 * in the module constructor when shared-tab mode is in use.
 *
 * After calling this, any method decorated with `@delegateInActiveTab` on the
 * same module instance will be routed to whichever tab the user last interacted
 * with (`portManager.activeTabId`), falling back to `mainClientId`.
 */
function setupActiveTabDelegate(
  module: object,
  portManager: PortManager,
  options?: { channelName?: string },
): void {
  if (!portManager.shared) return;

  const channelName = resolveConfiguredChannelName(
    module,
    options?.channelName,
  );

  portManager.checkMainTabMapping.set(module, () => portManager.isActiveTab);
  portManager.customClientDelegateNameMapping.set(module, channelName);

  portManager.onClient((transport: any) => {
    transport.listen(channelName, async (params: any) => {
      if (!portManager.isActiveTab) {
        return new Promise(() => {
          // not the target tab -- hang so the server picks the next transport
        });
      }
      const targetModule = getRef(module as any).modules![params.module];
      return applyMethod(targetModule, params);
    });
  });

  portManager.onServer((transport: any) => {
    transport.listen(channelName, async (params: any) => {
      if (!portManager.isWorkerMode && portManager.isActiveTab) {
        const targetModule = getRef(module as any).modules![params.module];
        return applyMethod(targetModule, params);
      }
      if (!portManager.activeTabId && !portManager.mainClientId) {
        await portManager.promiseMainTabClient;
      }
      const targetClientId =
        portManager.activeTabId ?? portManager.mainClientId;
      if (!targetClientId) {
        return new Promise(() => {
          // no active client available
        });
      }
      return transport.emit(
        { name: channelName, clientIds: [targetClientId] },
        params,
      );
    });
  });
}

/**
 * Decorator that delegates method execution to the user's active (visible) tab.
 *
 * Requires `setupActiveTabDelegate(this, portManager)` to be called in the
 * module constructor first. The module must have an `@injectable({ name })`
 * value, or the setup call must provide an explicit `channelName`.
 *
 * @example
 * ```ts
 * constructor(private _portManager: PortManager) {
 *   super();
 *   setupActiveTabDelegate(this, this._portManager);
 * }
 *
 * @delegateInActiveTab
 * async openLink(): Promise<void> {
 *   window.open('https://example.com');
 * }
 * ```
 */
const delegateInActiveTab = delegate('mainClient');

export { delegateInActiveTab, setupActiveTabDelegate };
