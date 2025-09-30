import {
  connectModule,
} from '@ringcentral-integration/widgets/lib/phoneContext';

import { SettingSection } from '../../components/SettingSection';

const PhoneNumberFormatSettingPage = connectModule((phone) => phone.phoneNumberFormatSettingUI)(
  SettingSection,
);

export default PhoneNumberFormatSettingPage;
