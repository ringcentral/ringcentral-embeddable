import {
  connectModule,
} from '@ringcentral-integration/widgets/lib/phoneContext';

import {
  ThirdPartySettingSection,
} from '../../components/ThirdPartySettingSection';

const ThirdPartySettingSectionPage = connectModule((phone) => phone.thirdPartySettingSectionUI)(
  ThirdPartySettingSection,
);

export default ThirdPartySettingSectionPage;
