import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { CallingSettingsPanel } from '../../components/CallingSettingsPanel';

export default connectModule((phone) => phone.callingSettingsUI)(
  CallingSettingsPanel,
);
