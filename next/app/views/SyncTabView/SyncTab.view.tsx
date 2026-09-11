import {
  SyncTabView as SyncTabViewBase,
  type SyncTabProps,
  type SyncTabViewOptions,
} from '@ringcentral-integration/micro-core/src/app/views';
import {
  injectable,
  optional,
  PortManager,
  RouterPlugin,
} from '@ringcentral-integration/next-core';
import clsx from 'clsx';

/**
 * Applies Spring UI's compact mode to all synchronized sub-tab groups.
 */
@injectable({
  name: 'SyncTabView',
})
export class SyncTabView extends SyncTabViewBase {
  constructor(
    router: RouterPlugin,
    portManager: PortManager,
    @optional('SyncTabViewOptions') options?: SyncTabViewOptions,
  ) {
    super(router, portManager, options);
  }

  override component(props: SyncTabProps) {
    return super.component({
      ...props,
      className: clsx('sui-compact', props.className),
      tabClassName: clsx('sui-compact', props.tabClassName),
    });
  }
}
