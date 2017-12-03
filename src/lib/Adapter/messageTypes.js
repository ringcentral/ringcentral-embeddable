import Enum from 'ringcentral-integration/lib/Enum';
import baseMessageTypes from 'ringcentral-widgets/lib/AdapterCore/baseMessageTypes';

export default new Enum([
  ...Object.keys(baseMessageTypes),
  'syncPresence',
], 'rc-adapter');
