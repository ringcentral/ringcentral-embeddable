import type { CxBaggageLead } from '../CxClient/interfaces';
import type { Lead } from '../CxLeads';

/**
 * What the Lead side widget tab shows.
 */
export type CxLeadInfoTarget =
  | {
      /** A fetched preview lead, opened from the Leads tab. */
      type: 'lead';
      requestId: string;
    }
  | {
      /** The lead of a call, keyed by its encoded `uii$sessionId`. */
      type: 'call';
      callId: string;
    };

/**
 * A lead as the Lead tab shows it: a call's baggage merged with its fetched
 * preview lead, or a preview lead on its own.
 */
export type CxLeadDetails = Partial<Lead> &
  CxBaggageLead & {
    leadId: string;
    /** Queue or campaign name the call came from. */
    sourceName?: string;
    sourceType?: string;
    sourceId?: string;
  };

/**
 * Label keys of the Lead details rows, translated by the panel.
 */
export type CxLeadInfoLabelKey =
  | 'source'
  | 'leadState'
  | 'preCallLeadPasses'
  | 'currentLeadPasses'
  | 'leadPasses'
  | 'title'
  | 'suffix'
  | 'email'
  | 'address1'
  | 'address2'
  | 'city'
  | 'state'
  | 'zip'
  | 'listDescription'
  | 'leadId'
  | 'externId'
  | 'gateKeeper'
  | 'aux1'
  | 'aux2'
  | 'aux3'
  | 'aux4'
  | 'aux5';

/**
 * Card a row is shown in, in display order: lead status, contact details,
 * ids, aux data, then extra data.
 */
export type CxLeadInfoGroup = 'status' | 'contact' | 'ids' | 'aux' | 'extra';

/**
 * One label/value row of the Lead details list.
 */
export interface CxLeadInfoRow {
  /** Stable React key. */
  id: string;
  group: CxLeadInfoGroup;
  /** Spans both columns of its card, for long values. */
  wide: boolean;
  /** Translated label; absent when `label` is the text itself. */
  labelKey?: CxLeadInfoLabelKey;
  /** Admin-defined label: a campaign aux label or an extra data key. */
  label?: string;
  value: string;
  /** Whether the value is a VRU recording URL, played instead of shown. */
  isRecording: boolean;
}

/**
 * Everything the Lead tab renders for its target.
 */
export interface CxLeadInfoData {
  target: CxLeadInfoTarget;
  /** The merged lead, also what the host lead viewer receives. */
  lead: CxLeadDetails;
  name: string;
  /** Raw numbers; formatted at render. */
  phoneNumbers: string[];
  /** Campaign or queue name. */
  source: string;
  /** Admin labels of the five aux fields; `undefined` keeps "Aux N". */
  auxLabels: Array<string | undefined>;
  rows: CxLeadInfoRow[];
}
