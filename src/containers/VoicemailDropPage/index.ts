import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import { VoicemailDropPanel } from '../../components/VoicemailDropPanel';

export const VoicemailDropPage = connectModule(
  (phone) => phone.voicemailDropUI,
)(VoicemailDropPanel);
