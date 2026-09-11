import I18n from '@ringcentral-integration/i18n';

import type enUS from './en-US';
// @ts-expect-error locale files are provided by the locale loader at build time.
import loadLocale from './loadLocale';

export default new I18n<typeof enUS>(loadLocale);
