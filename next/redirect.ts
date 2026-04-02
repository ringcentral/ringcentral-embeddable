import RedirectController from '@ringcentral-integration/widgets/lib/RedirectController';

export default new RedirectController({
  prefix: 'rc-embeddable',
  appOrigin: window.location.origin,
});
