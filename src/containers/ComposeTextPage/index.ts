import {
  connectModule,
} from '@ringcentral-integration/widgets/lib/phoneContext';

import ComposeTextPanel from '../../components/ComposeTextPanel';

export default connectModule((phone) => phone.composeTextUI)(ComposeTextPanel);
