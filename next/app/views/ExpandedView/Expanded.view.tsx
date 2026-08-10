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
  ExpandedViewOpenOptions,
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

  private readonly _contentHandles = new Map<string, ExpandedContentHandle>();

  @state
  isOpen = false;

  @state
  activeContentId: string | null = null;

  create(options: ExpandedViewCreatorOptions): ExpandedContentHandle {
    if (this._contentHandles.has(options.id)) {
      throw new Error(`Expanded content id is already registered: ${options.id}`);
    }
    const handle = new ExpandedContentHandle(options);
    this._contentHandles.set(options.id, handle);
    return handle;
  }

  @action
  private _setActiveContent(contentId: string | null): void {
    this.activeContentId = contentId;
    this.isOpen = contentId !== null;
  }

  open(
    handle: ExpandedContentHandle,
    { expand = true }: ExpandedViewOpenOptions = {},
  ): ExpandedViewOpenResult {
    if (this._contentHandles.get(handle.options.id) !== handle) {
      throw new Error(
        `Expanded content handle is not registered: ${handle.options.id}`,
      );
    }
    const previousHandle = this.activeContentId
      ? this._contentHandles.get(this.activeContentId)
      : undefined;
    this._setActiveContent(handle.options.id);
    if (previousHandle && previousHandle !== handle) {
      previousHandle.options.onDeactivate?.();
    }
    if (expand) {
      this._root.setExpanded(true);
    }
    return {
      close: () => this.close(handle),
    };
  }

  close(handle?: ExpandedContentHandle): void {
    const activeHandle = this.activeContentId
      ? this._contentHandles.get(this.activeContentId)
      : undefined;
    if (handle && handle !== activeHandle) {
      return;
    }
    this._setActiveContent(null);
    this._root.setExpanded(false);
    activeHandle?.options.onClose?.();
  }

  component() {
    const { activeContentId, isExpanded, isOpen } = useConnector(() => ({
      activeContentId: this.activeContentId,
      isExpanded: this._root.expanded,
      isOpen: this.isOpen,
    }));
    const activeHandle = activeContentId
      ? this._contentHandles.get(activeContentId)
      : undefined;

    if (!isOpen || !activeHandle) {
      return null;
    }

    const { view, header, showOverlayHeader = true } = activeHandle.options;
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
    const showHeader = (!isExpanded && showOverlayHeader) || headerContent;

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
