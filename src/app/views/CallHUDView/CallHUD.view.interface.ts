import type {
  MonitoredExtensionItem,
  PresenceActiveCall,
} from '../../services/MonitoredExtensions/MonitoredExtensions.interface';

export interface CallHUDPanelProps {
  searchInput: string;
  extensions: MonitoredExtensionItem[];
  groupedExtensions: Record<string, MonitoredExtensionItem[]>;
  typeFilterSelections: { label: string; value: string }[];
  typeList: TypeListItem[];
  type: string;
  disableClickToDial: boolean;
  canPark: boolean;
  canEdit: boolean;
  onSearchInputChange: (value: string) => void;
  onTypeChange: (type: string) => void;
  formatPhone: (phoneNumber: string) => string;
  onClickToDial: (recipient: {
    name?: string;
    id: string;
    phoneNumber: string;
  }) => void;
  onPark: (extension: { id: string; name?: string; extensionNumber?: string }) => void;
  onText: (text: string) => void;
  pickParkLocation: (
    extension: { id: string },
    activeCall: PresenceActiveCall,
  ) => void;
  pickGroupCall: (
    extension: { id: string },
    activeCall: PresenceActiveCall,
  ) => void;
  pickCallQueueCall: (
    extension: { id: string },
    activeCall: PresenceActiveCall,
  ) => void;
  onAddExtension: () => void;
  onAddExtensionForType: (type: string) => void;
  onRemoveExtension: (extensionId: string, extensionName: string, isParkLocation: boolean) => void;
}

export interface TypeListItem {
  id: string;
  unreadCount: number;
}

export interface AvailableExtension {
  id: string;
  name?: string;
  extensionNumber?: string;
  profileImageUrl?: string;
}
