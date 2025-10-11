import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import { ParkPanel } from '../../components/ParkPanel';

export const ParkPage = connectModule(
  (phone) => phone.parkUI,
)(ParkPanel);
