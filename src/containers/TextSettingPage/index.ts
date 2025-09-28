import {
  connectModule,
} from '@ringcentral-integration/widgets/lib/phoneContext';

import { SettingSection } from '../../components/SettingSection';

const TextSettingPage = connectModule((phone) => phone.textSettingUI)(
  SettingSection,
);

export default TextSettingPage;
