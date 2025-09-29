import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import { VoicemailDropSettingsPanel } from '../../components/VoicemailDropSettingsPanel';

export default connectModule(
  (phone) => phone.voicemailDropSettingsUI,
)(VoicemailDropSettingsPanel);
