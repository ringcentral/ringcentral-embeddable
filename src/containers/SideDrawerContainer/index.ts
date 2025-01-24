import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { SideDrawerView } from './SideDrawerView';

const SideDrawerContainer = connectModule(
  (phone) => phone.sideDrawerUI,
)(SideDrawerView);

export { SideDrawerContainer };
