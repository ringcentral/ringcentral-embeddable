import type { PortManager } from '@ringcentral-integration/next-core';

type MainTabCallback = () => void;

/**
 * Registers work for future main-tab promotions and runs it immediately when
 * a lazy module is loaded after the current tab has already become main.
 */
export function registerOnMainTab(
  portManager: PortManager,
  callback: MainTabCallback,
): () => void {
  const dispose = portManager.onMainTab(callback);
  if (portManager.isMainTab) {
    callback();
  }
  return dispose;
}
