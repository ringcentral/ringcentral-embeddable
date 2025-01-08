import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { SmartNotesPanel } from '../../components/SmartNotesPanel';

const SmartNotesPage = connectModule(
  (phone) => phone.smartNotesUI,
)(SmartNotesPanel);

export { SmartNotesPage };
