import type { ViewCallsFilterType } from '@ringcentral-integration/micro-phone/src/app/views/CallsListViewSpring/CallsList.view.interface';

import type { OlderCallsScope } from '../../services/CallLog';

/**
 * Returns the call direction older calls are fetched under for a calls list
 * filter, so a direction filter pages only the calls it shows. Missed calls
 * are inbound; the log status filters need every direction.
 */
export function getOlderCallsScope(
  filter: ViewCallsFilterType,
): OlderCallsScope {
  switch (filter) {
    case 'missed':
    case 'incoming':
      return 'Inbound';
    case 'outgoing':
      return 'Outbound';
    default:
      return 'All';
  }
}
