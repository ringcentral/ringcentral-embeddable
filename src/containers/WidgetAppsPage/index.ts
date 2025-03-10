import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import { WidgetAppsPanel } from '../../components/WidgetAppsPanel';

const WidgetAppsPage = connectModule(
  (phone) => phone.widgetAppsUI,
)(WidgetAppsPanel);

export { WidgetAppsPage };
