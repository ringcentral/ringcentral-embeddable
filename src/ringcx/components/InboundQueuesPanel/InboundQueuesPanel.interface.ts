/**
 * Inbound queue item interface
 */
interface InboundQueue {
  gateId: string;
  gateName: string;
  checked?: boolean;
}

/**
 * Props for InboundQueuesPanel component
 */
interface InboundQueuesPanelProps {
  /** List of inbound queues to display */
  inboundQueues: InboundQueue[];
  /** Currently selected queue IDs */
  selectedQueueIds: string[];
  /** Callback when selection is submitted */
  onSubmit: (selectedIds: string[]) => void;
  /** Callback when back button is clicked */
  onBack: () => void;
}

export type { InboundQueue, InboundQueuesPanelProps };
