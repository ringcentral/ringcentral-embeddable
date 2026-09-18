import dayjs from 'dayjs';

import type { CallInfoItem } from '../components/CallInfoHeader';

interface CallInfoMapping {
  // Read in order, first non-empty wins. DNIS leads with its E.164 form so the
  // panel shows the same number as the rest of the call UI.
  attrs: string[];
  name: string;
  formatTime?: boolean;
}

const CALL_INFO_MAP_LIST: CallInfoMapping[] = [
  { attrs: ['dnisE164', 'dnis'], name: 'DNIS' },
  { attrs: ['uii'], name: 'Call ID' },
  { attrs: ['termParty'], name: 'Term Party' },
  { attrs: ['termReason'], name: 'Term Reason' },
  { attrs: ['callDts'], name: 'Call Time', formatTime: true },
];

/**
 * Extract call detail metadata from call data for display in call info panel.
 */
export function getCallInfos(call: Record<string, any>): CallInfoItem[] {
  const endedCall = call.endedCall ?? {};
  return CALL_INFO_MAP_LIST.reduce<CallInfoItem[]>(
    (list, { attrs, name, formatTime }) => {
      const value: string =
        attrs.reduce<string>(
          (found, attr) => found || call[attr] || endedCall[attr] || '',
          '',
        ) || '';
      if (value) {
        list.push({
          name,
          content: formatTime
            ? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
            : value,
        });
      }
      return list;
    },
    [],
  );
}
