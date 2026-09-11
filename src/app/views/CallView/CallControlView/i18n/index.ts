import I18n from '@ringcentral-integration/i18n';
import { getTranslateFn } from '@ringcentral-integration/utils';

import type enUS from './en-US';
// @ts-expect-error locale files are resolved by the translation loader
import loadLocale from './loadLocale';

const i18n = new I18n<typeof enUS>(loadLocale);

export const t = getTranslateFn(i18n);

export default i18n;
