import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { AudioSettingsPanel } from '../../components/AudioSettingsPanel';

export default connectModule((phone) => phone.audioSettingsUI)(
  AudioSettingsPanel,
);
