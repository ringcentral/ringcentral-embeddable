import type { PortManager } from '@ringcentral-integration/next-core';

type ServerCallback = () => void;

/**
 * Registers work for the port that owns the RingCX Agent SDK: the server port
 * when the app is shared (the shared worker, or the server tab without one),
 * or the only port otherwise.
 *
 * `onServer` also runs the callback right away when a lazy module is loaded
 * after the port has already become the server.
 */
export function registerOnServer(
  portManager: PortManager,
  callback: ServerCallback,
): void {
  if (!portManager.shared) {
    callback();
    return;
  }
  portManager.onServer(() => {
    callback();
  });
}
