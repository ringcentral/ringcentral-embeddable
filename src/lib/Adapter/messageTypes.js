import { ObjectMap } from '@ringcentral-integration/core/lib/ObjectMap';
import baseMessageTypes from '@ringcentral-integration/widgets/lib/AdapterCore/baseMessageTypes';

const messageTypes = ObjectMap.prefixKeys([
  ...ObjectMap.keys(baseMessageTypes),
  'syncPresence',
], 'rc-adapter');
export default messageTypes;
