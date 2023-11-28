import {
  moduleActionTypes,
} from '@ringcentral-integration/commons/enums/moduleActionTypes';
import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';

export const actionTypes = ObjectMap.prefixKeys([
  ...ObjectMap.keys(moduleActionTypes),
  'syncClosed',
  'syncMinimized',
  'syncSize',
  'syncFocus',
  'syncPosition',
  'showAdapter',
  'setClickToDial',
  'setShowDemoWarning',
], 'rc-adapter');

export default actionTypes;
