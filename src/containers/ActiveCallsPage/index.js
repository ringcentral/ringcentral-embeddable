// TODO: fix switch call issue in widgets

import { connectModule } from 'ringcentral-widgets/lib/phoneContext';
import ActiveCallsPanel from '../../components/ActiveCallsPanel';

export default connectModule((phone) => phone.activeCallsUI)(ActiveCallsPanel);
