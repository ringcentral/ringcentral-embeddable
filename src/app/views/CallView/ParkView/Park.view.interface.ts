import type { Call } from '@ringcentral-integration/commons/interfaces/Call.interface';
import type { CallMetaInfo } from '@ringcentral-integration/micro-phone/src/app/services';

import type { MonitoredExtensionItem } from '../../../services/MonitoredExtensions';

import type { ParkPage } from './ParkPage';

export interface ParkViewOptions {
  component?: typeof ParkPage;
}

export interface ParkActionResult {
  fromNumber: string;
  destination: string;
}

export interface ParkViewPanelProps {
  parkLocations: MonitoredExtensionItem[];
  session: Call['webphoneSession'] | undefined;
  sessionId: string | undefined;
  onBack: () => void;
  onPark: (locationId?: string) => Promise<ParkActionResult | null>;
  onText: (text?: string) => Promise<void>;
  onCallEnd: () => void;
  formatPhone: (phoneNumber: string) => string;
}

export type ParkViewProps = {
  call: Call;
} & Pick<CallMetaInfo, 'actionsDisabled'>;
