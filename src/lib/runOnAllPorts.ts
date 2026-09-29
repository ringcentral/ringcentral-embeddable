import { fork } from '@ringcentral-integration/next-core';
import type { PortManager } from '@ringcentral-integration/next-core';

type PublicMethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: never[]) => unknown ? K : never;
}[keyof T] &
  string;

interface RunOnAllPortsOptions {
  /**
   * Also runs the method on a shared server port that is a browser tab.
   * A shared worker server has no window, so it is always skipped there.
   */
  includeServer?: boolean;
}

/**
 * Runs a module method on every port, starting from the shared server.
 *
 * Use this for broadcasts that change no shared state, such as posting to the
 * host page or re-emitting a local event. It replaces `@delegate('all')` and
 * `@delegate('clients')` for those cases, because both make every client
 * force a full state resync after the call, which gives every state object a
 * new reference and re-fires every reference-based watcher.
 *
 * On a non-shared port the method runs locally. On a shared client port it
 * also runs locally, since broadcasts are expected to start on the server.
 * The method must be public, because `fork()` resolves it by name on each
 * client.
 *
 * @returns settles once the local run finishes and the clients were reached;
 * a relay failure rejects it, so callers can log it.
 */
export async function runOnAllPorts<
  T extends object,
  K extends PublicMethodKeys<T>,
>(
  portManager: PortManager,
  module: T,
  method: K,
  args: Parameters<Extract<T[K], (...args: never[]) => unknown>>,
  { includeServer = true }: RunOnAllPortsOptions = {},
): Promise<void> {
  const run = async () => {
    await (module[method] as (...params: unknown[]) => unknown).apply(
      module,
      args,
    );
  };
  if (!portManager.shared || !portManager.isServer) {
    await run();
    return;
  }
  const localRun = includeServer && globalThis.window ? run() : undefined;
  await Promise.all([
    localRun,
    fork(module as never, method as never, args as never, { respond: false }),
  ]);
}
