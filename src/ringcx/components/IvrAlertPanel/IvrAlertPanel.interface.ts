/**
 * IVR Alert data item
 */
export interface IvrAlertData {
  /** Alert subject/title */
  subject: string;
  /** Alert body content */
  body: string;
}

/**
 * Props for IvrAlertPanel component
 */
export interface IvrAlertPanelProps {
  /** IVR alert data items */
  ivrAlertData: IvrAlertData[];
  /** Whether the call has ended (collapses panel) */
  isCallEnd?: boolean;
  /** Custom class name */
  className?: string;
  /** Data sign for testing */
  'data-sign'?: string;
}
