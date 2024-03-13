import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { CustomizedPanel } from '../../components/CustomizedPanel';

const CustomizedPage = connectModule((phone) => phone.customizedPageUI)(
  CustomizedPanel,
);

export default CustomizedPage;
