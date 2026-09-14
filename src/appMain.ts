import './main.global.scss';
import { createApp } from './createApp';

const worker = window.__rc_shared_worker__?.worker;

async function runApp(): Promise<Awaited<ReturnType<typeof createApp>>> {
  const app = await createApp(
    worker
      ? {
          name: 'rc-embeddable',
          port: 'client',
          type: 'SharedWorker',
          worker,
        }
      : {
          name: 'rc-embeddable',
          type: 'SharedTab',
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
