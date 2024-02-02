
import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { SubTabsView } from '../../components/SubTabsView';

const PhoneTabsContainer = connectModule(
  (phone) => phone.phoneTabsUI,
)(SubTabsView);

export { PhoneTabsContainer };
