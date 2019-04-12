import ProxyFrameController from './lib/ProxyFrameController';

const prefix = process.env.PREFIX;

export default new ProxyFrameController({
  prefix,
});
