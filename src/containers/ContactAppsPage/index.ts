import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { ContactAppsPanel } from '../../components/ContactAppsPanel';

const ContactAppsPage = connectModule(
  (phone) => phone.contactAppsUI,
)(ContactAppsPanel);

export { ContactAppsPage };
