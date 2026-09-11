import { isSharedWorker } from '@ringcentral-integration/next-core';
import { createApp } from './createApp';

// Extend global for app instance in worker context
declare const self: typeof globalThis & {
  __EV_APP_INITIALIZED__?: boolean;
};

// clear console before shared worker re run for better debug
if (process.env.NODE_ENV !== 'production' && isSharedWorker) {
  // eslint-disable-next-line no-console
  console.clear();
}

// Only create app if not already initialized (prevent double-initialization)
if (!self.__EV_APP_INITIALIZED__) {
  self.__EV_APP_INITIALIZED__ = true;
  createApp({
    name: 'rc-embeddable',
    port: 'server',
    type: 'SharedWorker',
  });
}
