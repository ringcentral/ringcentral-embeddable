import type { ComponentType, ReactNode } from 'react';
import type { RcViewModule } from '@ringcentral-integration/next-core';

export interface ExpandedViewCreatorOptions {
  view: ComponentType | RcViewModule;
  header?: string | ComponentType | (() => ReactNode);
  onClose?: () => void;
}

export class ExpandedContentHandle {
  constructor(public readonly options: ExpandedViewCreatorOptions) {}
}

export interface ExpandedViewOpenResult {
  close: () => void;
}
