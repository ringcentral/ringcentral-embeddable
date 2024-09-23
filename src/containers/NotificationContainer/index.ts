import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';
import type { NotificationContainerProps } from '@ringcentral-integration/widgets/containers/NotificationContainer/NotificationContainer.interface';
import { NotificationPanel } from '../../components/NotificationPanel';

export const NotificationContainer = connectModule<
  any,
  NotificationContainerProps
>((phone) => phone.alertUI)(NotificationPanel);
