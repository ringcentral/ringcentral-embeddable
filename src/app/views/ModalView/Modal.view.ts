import { ModalView as ModalViewBase } from '@ringcentral-integration/micro-core/src/app/views';
import { injectable, PortalHost } from '@ringcentral-integration/next-core';

/**
 * Leaves out open modals this port cannot render yet.
 *
 * Modal state is synced across tabs, but a tab registers a modal's definition
 * only once the module that creates it has loaded. A tab opened while a RingCX
 * modal is up receives that modal before its CX chunk arrives, and the base
 * view crashes looking the definition up. The modal shows up on the next
 * store update after its definition is registered.
 */
@injectable({
  name: 'ModalView',
})
export class ModalView extends ModalViewBase {
  constructor(private readonly _host: PortalHost) {
    super(_host);
  }

  override get modals() {
    const modals = super.modals;
    const renderable = modals.filter(({ id }) => !!id && !!this._host.getMap(id));
    // Keep the computed array while nothing is left out, so connectors that
    // select `modals` do not re-render on every store update.
    return renderable.length === modals.length ? modals : renderable;
  }
}
