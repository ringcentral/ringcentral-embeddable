import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import type { ConferenceDialerUIContainerProps } from '@ringcentral-integration/widgets/modules/ConferenceDialerUI/ConferenceDialerUI.interface';
import { ConferenceDialerPanel } from '../../components/ConferenceDialerPanel';

export const ConferenceCallDialerPage = connectModule<
  any,
  ConferenceDialerUIContainerProps
>((phone) => phone.conferenceDialerUI)(ConferenceDialerPanel);

export default ConferenceCallDialerPage;
