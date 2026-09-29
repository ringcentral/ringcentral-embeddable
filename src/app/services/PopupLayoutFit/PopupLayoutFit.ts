import {
  fromWatch,
  injectable,
  optional,
  PortManager,
  RcModule,
} from '@ringcentral-integration/next-core';
import {
  distinctUntilChanged,
  fromEvent,
  map,
  startWith,
  type Subscription,
} from 'rxjs';

import { ExpandedView } from '../../views/ExpandedView';
import { SideWidgetView } from '../../views/SideWidgetView';
import { Adapter } from '../Adapter';
import {
  getExpandedAppWidth,
  MIN_EXPANDED_WINDOW_WIDTH,
} from '../Adapter/appWidth';
import { TabManager } from '../TabManager';

/**
 * Lays the popup window out for the width the user gives it.
 *
 * In the widget, `Adapter` resizes the host frame to fit the expanded column,
 * but the user sizes the popup window. Squeezing the main column and the side
 * widget into a narrow popup leaves both unusable, so the popup reports
 * whether its width fits, and `ExpandedView` shows the side widget as an
 * overlay over the main column until the window is wide enough again. Tabs
 * that want a wider panel, such as RingCX's, only set the width the window
 * grows to, so a window the user narrows keeps both columns down to
 * `MIN_EXPANDED_WINDOW_WIDTH`.
 *
 * Asking to expand while the window is too narrow, such as opening a call's
 * details, grows the window to fit; narrowing it by hand folds the layout
 * without growing the window back.
 */
@injectable({
  name: 'PopupLayoutFit',
})
export class PopupLayoutFit extends RcModule {
  constructor(
    private _expandedView: ExpandedView,
    private _portManager: PortManager,
    private _tabManager: TabManager,
    @optional() private _adapter?: Adapter,
    @optional() private _sideWidgetView?: SideWidgetView,
  ) {
    super();
    // Lifecycle hooks only run on the server port, and the popup window is a
    // client of the shared worker.
    if (this._portManager.shared) {
      this._portManager.onClient(() => this._bindWindow());
    }
  }

  private _subscriptions: Subscription[] = [];

  private _reportedFit = false;

  /** Binds a popup window that is also the server port, or is not shared. */
  override onInit(): void {
    this._bindWindow();
  }

  override onReset(): void {
    this._subscriptions.forEach((subscription) => subscription.unsubscribe());
    this._subscriptions = [];
  }

  private get _requiredWidth(): number {
    return getExpandedAppWidth(this._sideWidgetView?.minExpandedWidth);
  }

  private _growWindow(): void {
    this._adapter?.requestPopupWindowWidth(this._requiredWidth);
  }

  private _bindWindow(): void {
    // The shared worker has no window, and only the popup window sets its
    // own width.
    if (
      this._subscriptions.length > 0 ||
      !this._tabManager.fromPopup ||
      !globalThis.window
    ) {
      return;
    }
    this._subscriptions = [
      fromEvent(window, 'resize')
        .pipe(
          startWith(null),
          map(() => window.innerWidth >= MIN_EXPANDED_WINDOW_WIDTH),
          distinctUntilChanged(),
        )
        .subscribe((fits) => {
          // The popup opens at the folded width, so content already docked
          // when it opens, such as a call's details, grows the window rather
          // than folding as if the user had narrowed it.
          void this._expandedView.setFitsExpandedLayout(fits, {
            windowOpened: !this._reportedFit,
          });
          this._reportedFit = true;
        }),
      fromWatch(this, () => this._expandedView.expandRequests).subscribe(() => {
        this._growWindow();
      }),
      // The fit is shared state, so the widget frame that takes over when the
      // popup closes must not inherit a narrow popup's folded layout.
      fromEvent(window, 'pagehide').subscribe(() => {
        void this._expandedView.setFitsExpandedLayout(true);
      }),
    ];
  }
}
