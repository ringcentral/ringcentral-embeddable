import Enum from 'ringcentral-integration/lib/Enum';
import { moduleActionTypes } from 'ringcentral-integration/enums/moduleActionTypes';

export default new Enum([
  ...Object.keys(moduleActionTypes),
  'syncClosed',
  'syncMinimized',
  'syncSize',
  'syncFocus',
  'syncPosition',
  'showAdapter',
  'setClickToDial',
], 'rc-adapter');
