import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { GlipChatPanel } from '../../components/GlipChatPanel';

export const GlipChatPage = connectModule(
  (phone) => phone.glipChatUI,
)(GlipChatPanel);

export default GlipChatPage;
