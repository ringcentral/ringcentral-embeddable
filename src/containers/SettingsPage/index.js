import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { SettingsPanel } from '../../components/SettingsPanel';

const SettingsPage = connectModule((phone) => phone.settingsUI)(
  SettingsPanel,
);

export default SettingsPage;
