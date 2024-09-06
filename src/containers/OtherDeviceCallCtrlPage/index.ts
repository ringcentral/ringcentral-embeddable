import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { OtherDeviceCallCtrlPanel } from '../../components/OtherDeviceCallCtrlPanel';

const OtherDeviceCallCtrlPage = connectModule(
  (phone) => phone.simpleCallControlUI,
)(OtherDeviceCallCtrlPanel);

export { OtherDeviceCallCtrlPage };
