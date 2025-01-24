import { GlipGroupsPanel } from '../../components/GlipGroupsPanel';
import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

export const GlipGroupsPage = connectModule(
  (phone) => phone.glipGroupsUI,
)(GlipGroupsPanel);

export default GlipGroupsPage;
