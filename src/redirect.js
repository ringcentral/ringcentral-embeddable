import RedirectController from './lib/RedirectController';

const prefix = process.env.PREFIX;

export default new RedirectController({
  prefix,
});
