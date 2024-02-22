import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import ContactsView from '../../components/ContactsView';

export default connectModule((phone) => phone.contactListUI)(ContactsView);
