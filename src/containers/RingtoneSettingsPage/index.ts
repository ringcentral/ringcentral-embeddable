import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { RingtoneSettingsPanel } from '../../components/RingtoneSettingsPanel';

const RingtoneSettingsPage = connectModule((phone) => phone.ringtoneSettingsUI)(
  RingtoneSettingsPanel,
);

export default RingtoneSettingsPage;
