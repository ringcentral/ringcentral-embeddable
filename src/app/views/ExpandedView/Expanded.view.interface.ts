import type { ComponentType, ReactNode } from 'react';
import type { RcViewModule } from '@ringcentral-integration/next-core';

export interface ExpandedViewCreatorOptions {
  id: string;
  view: ComponentType | RcViewModule;
  header?: string | ComponentType | (() => ReactNode);
  showOverlayHeader?: boolean;
  onDeactivate?: () => void;
  onClose?: () => void;
}

export class ExpandedContentHandle {
  constructor(public readonly options: ExpandedViewCreatorOptions) {}
}

export interface ExpandedViewOpenResult {
  close: () => Promise<void>;
}

export interface ExpandedViewOpenOptions {
  expand?: boolean;
}

export interface ExpandedViewCloseOptions {
  collapseLayout?: boolean;
}

export interface ExpandedViewFitOptions {
  /**
   * The report comes from a window that has just opened, rather than one the
   * user resized, so content docked before it opened grows it to fit.
   */
  windowOpened?: boolean;
}
