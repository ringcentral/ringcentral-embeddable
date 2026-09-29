import { ExpandedLayoutPopper } from '@ringcentral-integration/micro-core/src/app/components';
import {
  action,
  delegate,
  injectable,
  PortManager,
  RcViewModule,
  Root,
  state,
  useConnector,
  watch,
} from '@ringcentral-integration/next-core';
import { PageHeader } from '@ringcentral-integration/next-widgets/components';
import type { ComponentType } from 'react';
import React from 'react';

import type {
  ExpandedViewCloseOptions,
  ExpandedViewCreatorOptions,
  ExpandedViewFitOptions,
  ExpandedViewOpenOptions,
  ExpandedViewOpenResult,
} from './Expanded.view.interface';
import { ExpandedContentHandle } from './Expanded.view.interface';

@injectable({
  name: 'ExpandedView',
})
export class ExpandedView extends RcViewModule {
  constructor(
    private _root: Root,
    private _portManager: PortManager,
  ) {
    super();
  }

  private readonly _contentHandles = new Map<string, ExpandedContentHandle>();

  @state
  isOpen = false;

  @state
  activeContentId: string | null = null;

  /**
   * Whether the window is wide enough for the expanded column. Only a window
   * the user sizes, such as the popup, reports it; while it is off the layout
   * stays folded and open content shows as an overlay.
   */
  @state
  fitsExpandedLayout = true;

  /**
   * Counts the requests to expand that the window was too narrow for, so the
   * popup window can grow to fit them. Folding because the user narrowed the
   * window is not counted: the window is not grown back against the user.
   */
  @state
  expandRequests = 0;

  /**
   * Server only: expanding was asked for, or the layout was folded, while the
   * window was too narrow, so the content docks once the window fits again.
   */
  private _expandDeferred = false;

  private _stopWatchingExpanded: (() => void) | null = null;

  create(options: ExpandedViewCreatorOptions): ExpandedContentHandle {
    if (this._contentHandles.has(options.id)) {
      throw new Error(
        `Expanded content id is already registered: ${options.id}`
      );
    }
    const handle = new ExpandedContentHandle(options);
    this._contentHandles.set(options.id, handle);
    return handle;
  }

  @action
  private _setFitsExpandedLayout(fits: boolean): void {
    this.fitsExpandedLayout = fits;
  }

  @action
  private _countExpandRequest(): void {
    this.expandRequests += 1;
  }

  /** Defers an expansion the window is too narrow for until it fits. */
  private _deferExpand(): void {
    this._expandDeferred = true;
    this._countExpandRequest();
  }

  /**
   * Reports whether the window fits the expanded layout. Folds the layout when
   * it stops fitting, and docks the open content back when it fits again.
   */
  @delegate('server')
  async setFitsExpandedLayout(
    fits: boolean,
    { windowOpened = false }: ExpandedViewFitOptions = {},
  ): Promise<void> {
    if (fits === this.fitsExpandedLayout) {
      if (!fits && windowOpened && this.activeContentId !== null) {
        // A window opened too narrow for content still waiting to dock.
        this._countExpandRequest();
      }
      return;
    }
    this._setFitsExpandedLayout(fits);
    if (!fits) {
      if (this._root.expanded) {
        // Narrowed by hand, the window is not grown back; a window that has
        // just opened grows to fit what was already docked.
        if (windowOpened) {
          this._deferExpand();
        } else {
          this._expandDeferred = true;
        }
        await this._root.setExpanded(false);
      }
      return;
    }
    const dock = this._expandDeferred && this.activeContentId !== null;
    this._expandDeferred = false;
    if (dock) {
      await this._root.setExpanded(true);
    }
  }

  /** Expands the layout, or defers it until the window fits. */
  @delegate('server')
  async expand(): Promise<void> {
    if (!this.fitsExpandedLayout) {
      this._deferExpand();
      return;
    }
    await this._root.setExpanded(true);
  }

  @action
  private _setActiveContent(contentId: string | null): void {
    this.activeContentId = contentId;
    this.isOpen = contentId !== null;
  }

  open(
    handle: ExpandedContentHandle,
    { expand = true }: ExpandedViewOpenOptions = {}
  ): ExpandedViewOpenResult {
    if (this._contentHandles.get(handle.options.id) !== handle) {
      throw new Error(
        `Expanded content handle is not registered: ${handle.options.id}`
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
      void this.expand();
    }
    return {
      close: () => this.close(handle),
    };
  }

  close(
    handle?: ExpandedContentHandle,
    { collapseLayout = true }: ExpandedViewCloseOptions = {}
  ): Promise<void> {
    const activeHandle = this.activeContentId
      ? this._contentHandles.get(this.activeContentId)
      : undefined;
    if (handle && handle !== activeHandle) {
      return Promise.resolve();
    }
    this._setActiveContent(null);
    this._expandDeferred = false;
    const collapsePromise = collapseLayout
      ? Promise.resolve(this._root.setExpanded(false))
      : Promise.resolve();
    activeHandle?.options.onClose?.();
    return collapsePromise;
  }

  override onInit(): void {
    if (this._portManager.shared && !this._portManager.isServer) {
      return;
    }
    // Other writers of `Root.expanded`, such as the Phone tab's expand
    // button, do not go through `expand`, so a too narrow window folds the
    // layout they expand.
    this._stopWatchingExpanded = watch(
      this,
      () => this._root.expanded,
      (expanded) => {
        if (!expanded || this.fitsExpandedLayout) {
          return;
        }
        this._deferExpand();
        void this._root.setExpanded(false);
      },
    );
  }

  override onReset(): void {
    this._stopWatchingExpanded?.();
    this._stopWatchingExpanded = null;
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
      typeof view === 'function' ? view : (view as RcViewModule).component;

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
