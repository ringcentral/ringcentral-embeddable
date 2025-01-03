import {
  connectModule,
} from '@ringcentral-integration/widgets/lib/phoneContext';

import { SettingSection } from '../../components/SettingSection';

const ThirdPartySettingSectionPage = connectModule((phone) => phone.thirdPartySettingSectionUI)(
  SettingSection,
);

export default ThirdPartySettingSectionPage;
