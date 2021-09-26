import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import NewSettingsPanel from '../../components/SettingsPanel';

const SettingsPage = connectModule((phone) => phone.settingsUI)(
  NewSettingsPanel,
);

export default SettingsPage;
