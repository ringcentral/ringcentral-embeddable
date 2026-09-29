import type { SyncTabProps } from '@ringcentral-integration/micro-core/src/app/views';

/**
 * CxAgentView configuration options
 */
export interface CxAgentViewOptions {
  /**
   * Default tab to show on initial render
   */
  defaultTab?: string;
}

/**
 * CxAgentView component props
 */
export interface CxAgentViewProps {
  /**
   * Optional initial tab to display
   */
  initialTab?: string;
}

/**
 * CxAgentView panel props for UI binding
 */
export interface CxAgentViewPanelProps {
  tabs: SyncTabProps['tabs'];
  currentTab: string;
}
