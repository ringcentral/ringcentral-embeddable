
import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { PhoneTabsView } from '../../components/PhoneTabsView';

const PhoneTabsContainer = connectModule(
  (phone) => phone.phoneTabsUI,
)(PhoneTabsView);

export { PhoneTabsContainer };
