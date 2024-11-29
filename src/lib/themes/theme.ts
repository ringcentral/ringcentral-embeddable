import { LiteralUnion, RcThemeInput } from '@ringcentral/juno';

import attRich from './attRich';
import btRich from './btRich';
import rcJupiterBlue from './rcJupiterBlue';
import telusRich from './telusRich';
import avayaCustomized from './avayaCustomized';
import atosRich from './atosRich';
import rainbowRich from './rainbowRich';
import rcDark from './rcDark';

// TODO: temporary import all, wait dynamic load way implement
export const brandThemeMapping = {
  jupiterBlue: rcJupiterBlue as RcThemeInput,
  att: attRich as RcThemeInput,
  telus: telusRich as RcThemeInput,
  bt: btRich as RcThemeInput,
  avaya: avayaCustomized as RcThemeInput,
  atos: atosRich as RcThemeInput,
  rainbow: rainbowRich as RcThemeInput,
  rcDark: rcDark as RcThemeInput,
} as const;

export type BrandTheme = keyof typeof brandThemeMapping | 'rc';
 
const innerGetBrandTheme = (
  brand: LiteralUnion<BrandTheme> = 'rc',
  defaultTheme: RcThemeInput,
): RcThemeInput => {
  if (brand === 'rc') {
    return defaultTheme;
  }

  return (brandThemeMapping as any)[brand] || defaultTheme;
};

export const getBrandThemeWithJupiterBlue = (
  brand: LiteralUnion<BrandTheme> = 'rc',
): RcThemeInput => {
  return innerGetBrandTheme(brand, brandThemeMapping.jupiterBlue);
};

export const getBrandDarkTheme = (
  brand: LiteralUnion<BrandTheme> = 'rc',
): RcThemeInput => {
  return innerGetBrandTheme(brand, brandThemeMapping.rcDark);
};
