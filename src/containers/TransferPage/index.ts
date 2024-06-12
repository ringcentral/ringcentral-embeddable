import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import type { TransferUIContainerProps } from '@ringcentral-integration/widgets/modules/TransferUI';

import TransferPanel from '../../components/TransferPanel';

export default connectModule<any, TransferUIContainerProps>(
  (phone) => phone.transferUI,
)(TransferPanel);