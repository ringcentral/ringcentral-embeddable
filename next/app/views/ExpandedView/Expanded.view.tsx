import { ExpandedLayoutPopper } from '@ringcentral-integration/micro-core/src/app/components';
import {
  action,
  injectable,
  RcViewModule,
  Root,
  state,
  useConnector,
} from '@ringcentral-integration/next-core';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import type { ComponentType } from 'react';
import React from 'react';

import type {
  ExpandedViewCreatorOptions,
  ExpandedViewOpenResult,
} from './Expanded.view.interface';
import { ExpandedContentHandle } from './Expanded.view.interface';

@injectable({
  name: 'ExpandedView',
})
export class ExpandedView extends RcViewModule {
  constructor(private _root: Root) {
    super();
  }

  private _activeHandle: ExpandedContentHandle | null = null;

  @state
  isOpen = false;

  create(options: ExpandedViewCreatorOptions): ExpandedContentHandle {
    return new ExpandedContentHandle(options);
  }

  @action
  private _setIsOpen(open: boolean) {
    this.isOpen = open;
  }

  open(handle: ExpandedContentHandle): ExpandedViewOpenResult {
    this._activeHandle = handle;
    this._setIsOpen(true);
    this._root.setExpanded(true);
    return {
      close: () => this.close(),
    };
  }

  close() {
    const onClose = this._activeHandle?.options.onClose;
    this._activeHandle = null;
    this._setIsOpen(false);
    this._root.setExpanded(false);
    onClose?.();
  }

  component() {
    const isExpanded = useConnector(() => this._root.expanded);
    const isOpen = useConnector(() => this.isOpen);

    if (!isOpen || !this._activeHandle) {
      return null;
    }

    const { view, header } = this._activeHandle.options;
    const ContentView =
      typeof view === 'function'
        ? view
        : (view as RcViewModule).component;

    const resolveHeader = () => {
      if (!header) return null;
      if (typeof header === 'string') return header;
      // ComponentType has prototype.isReactComponent or is a class/named function
      if (
        typeof header === 'function' &&
        (header.prototype?.isReactComponent || header.length === 1)
      ) {
        const HeaderComp = header as ComponentType;
        return <HeaderComp />;
      }
      // () => ReactNode getter
      return (header as () => React.ReactNode)();
    };

    const headerContent = resolveHeader();
    const showHeader = !isExpanded || headerContent;

    return (
      <ExpandedLayoutPopper expanded={isExpanded}>
        <div className="flex flex-col h-full">
          {showHeader && (
            <PageHeader
              className="border-b border-neutral-l02"
              onBackClick={!isExpanded ? () => this.close() : undefined}
            >
              {headerContent}
            </PageHeader>
          )}
          <div className="flex-auto overflow-hidden">
            <ContentView />
          </div>
        </div>
      </ExpandedLayoutPopper>
    );
  }
}
