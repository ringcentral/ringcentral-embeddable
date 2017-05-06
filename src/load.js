import RibbonController from './modules/RibbonController';
import hostingUrl from './config/hostingUrl';

const adapterUrl = `${hostingUrl}/adapter.html`;

window.RC = new RibbonController({
  prefix: 'rc-integration',
  adapterUrl,
});

window.RC.init();
