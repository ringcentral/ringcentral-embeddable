import attVariable from './att';
import btVariable from './bt';
import rcVariable from './rc';
import telusVariable from './telus';

const mapping = {
  rc: rcVariable,
  att: attVariable,
  bt: btVariable,
  telus: telusVariable,
};

export const getBrandVariable = (brand = 'rc') => {
  return mapping[brand] || mapping.rc;
};
