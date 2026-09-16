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

interface ActiveTabDelegateOptions {
  channelName?: string;
  /**
   * Whether the calling port is the delegation target. Defaults to "the tab the
   * user last interacted with".
   */
  isTargetClient?: () => boolean;
  /**
   * Client id to route to, evaluated on the server. Defaults to the active tab,
   * falling back to the main client.
   */
  resolveTargetClientId?: () => string | null | undefined;
}

/**
 * Registers per-module delegation wiring. Must be called once in the module
 * constructor when shared-tab mode is in use.
 *
 * After calling this, any method decorated with `@delegateInActiveTab` on the
 * same module instance will be routed to whichever tab the user last interacted
 * with (`portManager.activeTabId`), falling back to `mainClientId`.
 *
 * Pass `isTargetClient`/`resolveTargetClientId` to route to a different port
 * instead — for example the tab that owns the webphone.
 */
function setupActiveTabDelegate(
  module: object,
  portManager: PortManager,
  options?: ActiveTabDelegateOptions,
): void {
  if (!portManager.shared) return;

  const channelName = resolveConfiguredChannelName(
    module,
    options?.channelName,
  );
  const isTargetClient =
    options?.isTargetClient ?? (() => portManager.isActiveTab);
  const resolveTargetClientId =
    options?.resolveTargetClientId ??
    (() => portManager.activeTabId ?? portManager.mainClientId);

  portManager.checkMainTabMapping.set(module, isTargetClient);
  portManager.customClientDelegateNameMapping.set(module, channelName);

  portManager.onClient((transport: any) => {
    transport.listen(channelName, async (params: any) => {
      if (!isTargetClient()) {
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
      if (!portManager.isWorkerMode && isTargetClient()) {
        const targetModule = getRef(module as any).modules![params.module];
        return applyMethod(targetModule, params);
      }
      if (!resolveTargetClientId() && !portManager.mainClientId) {
        await portManager.promiseMainTabClient;
      }
      const targetClientId = resolveTargetClientId();
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
export type { ActiveTabDelegateOptions };
