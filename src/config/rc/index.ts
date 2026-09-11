import type { AppConfig } from '..';
import { brandConfig } from './brandConfig';
import { version as packageVersion } from '../../../package.json';

const version = packageVersion;

export default {
  brandConfig,
  sdkConfig: {
    clientId: '',
    clientSecret: '',
    server: '',
  },
  analyticsKey: '',
  enableIDB: false,
  version: {
    buildHash: '',
    releaseVersion: version,
    appVersion: version,
  },
  prefix: 'rc-widget',
} as AppConfig;
