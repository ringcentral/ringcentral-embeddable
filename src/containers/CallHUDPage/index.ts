import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import { CallHUDPanel } from '../../components/CallHUDPanel';

export const CallHUDPage = connectModule(
  (phone) => phone.callHUDUI,
)(CallHUDPanel);
