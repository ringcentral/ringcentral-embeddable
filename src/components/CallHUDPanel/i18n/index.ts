import I18n from '@ringcentral-integration/i18n';

import type enUS from './en-US';
// @ts-expect-error
import loadLocale from './loadLocale';

const i18n = new I18n<typeof enUS>(loadLocale);

export const t = i18n.getString.bind(i18n);

export type I18nKey = keyof typeof enUS;

export default i18n;