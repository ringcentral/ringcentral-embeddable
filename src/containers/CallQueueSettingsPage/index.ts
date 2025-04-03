import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { CallQueueSettingsPanel } from '../../components/CallQueueSettingsPanel';

export default connectModule((phone) => phone.callQueueSettingsUI)(
  CallQueueSettingsPanel,
);
