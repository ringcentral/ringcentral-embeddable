import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { ContactDetailsView } from '../../components/ContactDetailsView';

export default connectModule((phone) => phone.contactDetailsUI)(
  ContactDetailsView,
);
