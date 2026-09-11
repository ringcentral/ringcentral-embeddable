import './main.global.scss';
import { createApp } from './createApp';

// Just for worker can be build https://webpack.js.org/guides/web-workers/
export const createWorker = () => {
  new SharedWorker(
    // @ts-ignore
    /* webpackChunkName: "worker" */ new URL('./worker.ts', import.meta.url),
  );
};
const worker = global.__rc_shared_worker__?.worker;

async function runApp() {
  const app = await createApp(
    {
      name: 'rc-embeddable',
      port: 'client',
      type: 'SharedWorker',
      worker,
    },
    [],
  );

  if (typeof document !== 'undefined') {
    const container = document.getElementById('app');
    if (container) {
      app.bootstrap(container);
    }
  }
  return app;
}

runApp();
