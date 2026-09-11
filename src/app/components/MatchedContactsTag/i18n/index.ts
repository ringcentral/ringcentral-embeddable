import I18n from '@ringcentral-integration/i18n';

import type enUS from './en-US';
// @ts-expect-error locale files are resolved by the translation loader
import loadLocale from './loadLocale';

export default new I18n<typeof enUS>(loadLocale);
