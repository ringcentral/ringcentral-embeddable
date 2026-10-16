---
type: adr
title: ADR-0004 - Expose RingCX through the host third-party protocol
description: RingCX calls reuse rc-* events and registerThirdPartyService, with source ringcx, instead of the standalone rc-ev protocol.
owner: NEEDS_OWNER
status: proposed
risk_level: high
tags: [ringcx, adapter, third-party]
---

## Context

The standalone RingCX Embeddable spoke to host pages with `rc-ev-*` messages. Disposition and CRM logging were one page and one payload. This app already has a third-party protocol for RingEX calls: `registerThirdPartyService`, `rc-call-*-notify`, and `callLoggerPath`.

Hosts that already integrate this app should support RingCX by reading `call.source`, not by implementing a second protocol.

## Decision

D4: RingCX calls are normalized to the host call shape and emitted through the existing call events with `call.source = 'ringcx'` and `call.ringcx` for RingCX-only data. New session, state, and lead events are namespaced `rc-ringcx-*`. The integrated softphone reuses the host WebPhone, so its status stays on `rc-webphone-connection-status-notify`. New commands are namespaced `rc-adapter-ringcx-*`. `rc-adapter-new-call` accepts `callWith: 'ringcx'`. `rc-adapter-control-call` accepts `source: 'ringcx'`.

D6: After a RingCX disposition is submitted, the host log page opens automatically when the host registered `showLogModal`. RingEX calls still open that page only from an explicit history action.

D7: A RingCX history row uses only the host log actions. Log call, Edit log, and View log follow the host labels, titles, and disabled states, and are hidden when no `callLoggerPath` is registered. The logged status comes from call log matches, as for RingEX rows, not from the RingCX disposition. The standalone Edit call outcome action is removed from the history detail.

D8: The disposition note is sent as `call.ringcx.notes` on every RingCX log request and is also the prefilled `note` of the default log page. A customized schema without a `note` field still receives the note.

Q7: RingCX history stays in the Agent tab. `/unlogged-calls` does not include RingCX calls. This decision covers list membership only. RingCX calls still log through the host pipeline. Revisit after pilot feedback.

Disposition always runs before logging. A failed `callLoggerPath` must not leave the agent in Pending Disposition.

## Options considered

### Keep the standalone rc-ev protocol beside the host protocol

Rejected. Hosts would implement two contracts for one widget, and the disposition page would keep doing the CRM log.

### Put a ringcx branch inside the host log page

Rejected. `src/app` must not import the RingCX chunk. A call-log source registry gives the chunk a seam and leaves phase 5 the same extension point.

### Merge RingCX history into Phone > Calls now

Rejected for this phase. Logging no longer depends on list membership, and mixing the lists before pilot feedback would change the Phone tab for every user with the flag on.

## Consequences

- Hosts migrate from `rc-ev-*` with the mapping in `docs/integration/ringcx.md`. That mapping is informational. The standalone protocol is not a compatibility target.
- The disposition form is no longer a log form.
- Auto-opening the log page after disposition is new compared with RingEX.
- The contract registry in `src/app/contracts/ringcx-third-party.contract.ts` is the checklist for events, commands, and registration options.
