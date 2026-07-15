import type { ComponentType, ReactNode } from 'react';
import type { RcViewModule } from '@ringcentral-integration/next-core';

export interface ExpandedViewCreatorOptions {
  id: string;
  view: ComponentType | RcViewModule;
  header?: string | ComponentType | (() => ReactNode);
  onDeactivate?: () => void;
  onClose?: () => void;
}

export class ExpandedContentHandle {
  constructor(public readonly options: ExpandedViewCreatorOptions) {}
}

export interface ExpandedViewOpenResult {
  close: () => void;
}
