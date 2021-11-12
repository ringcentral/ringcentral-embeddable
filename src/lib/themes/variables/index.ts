import atosVariable from './atos';
import attVariable from './att';
import avayaVariable from './avaya';
import btVariable from './bt';
import rainbowVariable from './rainbow';
import rcVariable from './rc';
import telusVariable from './telus';

const mapping = {
  rc: rcVariable,
  att: attVariable,
  bt: btVariable,
  telus: telusVariable,
  avaya: avayaVariable,
  atos: atosVariable,
  rainbow: rainbowVariable,
};

export const getBrandVariable = (brand = 'rc') => {
  return mapping[brand] || mapping.rc;
};
