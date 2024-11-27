import {
  connectModule,
} from '@ringcentral-integration/widgets/lib/phoneContext';

import { SettingSection } from '../../components/SettingSection';

const ThemeSettingPage = connectModule((phone) => phone.themeSettingUI)(
  SettingSection,
);

export default ThemeSettingPage;
