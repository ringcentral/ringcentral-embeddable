import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import { CallCtrlContainer } from './CallCtrlContainer';

export const CallCtrlPage = connectModule((phone) => phone.callControlUI)(
  CallCtrlContainer,
);
