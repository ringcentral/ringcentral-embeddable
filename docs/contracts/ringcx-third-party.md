---
type: contract
title: RingCX Third-Party Contract
description: Host-page events, commands, and registration options for RingCX calls inside RingCentral Embeddable.
owner: NEEDS_OWNER
status: proposed
risk_level: high
tags: [ringcx, adapter, third-party]
---

## Intent

A host that already integrates RingCentral Embeddable MUST be able to log, match, and control RingCX calls through the existing `rc-*` protocol. RingCX data is additive. It MUST NOT require `rc-ev-*` messages.

## Boundaries

- `call.source === 'ringcx'` identifies a RingCX call. Absence means a RingEX call.
- `call.id` MUST equal `call.sessionId`. That value is the call-log matcher key.
- New events use the `rc-ringcx-` prefix. New commands use the `rc-adapter-ringcx-` prefix, except `rc-adapter-new-call` and `rc-adapter-control-call`, which gain optional discriminators.
- Disposition MUST complete before call logging. A `callLoggerPath` failure MUST NOT block disposition.
- `/unlogged-calls` MUST NOT include RingCX calls.

## MUST rules

1. `rc-call-ring-notify`, `rc-call-start-notify`, and `rc-call-end-notify` MUST include `call.source = 'ringcx'` and `call.ringcx` for RingCX calls.
   `rc-active-call-notify` MUST be sent once per status (`Ringing`, `CallConnected`, `NoCall`) for a RingCX call, in the RingEX active call shape, and MUST NOT report the RingEX bridge leg of that call.
2. `rc-ringcx-call-disposed-notify` MUST follow a submitted disposition and MUST include `call.ringcx.disposition` and `call.ringcx.notes` when the agent entered them, and `call.aiNote` when the disposition form has a call summary.
3. Commands that require a ready agent session MUST answer with a toast and `rc-ringcx-agent-session-notify` when the session is not ready. They MUST NOT be dropped silently.
   `rc-adapter-control-call` actions that are not allowed, fail, or are unsupported for a RingCX call MUST show a toast.
4. `callLoggerPath` requests for RingCX calls MUST be produced by the host `CallLogger`. `triggerType: 'callDisposition'` MUST mean a silent log after disposition. It MUST be sent with `redirect: true` so the host decides, from its own auto-log setting, whether to open the logged record.
5. When `showLogModal` and `callLoggerPath` are both registered, a submitted RingCX disposition MUST open `/log/call/<id>?source=ringcx` once the call has ended, and MUST NOT send the silent `callDisposition` log. A disposition submitted while the call is still connected MUST open the page when the call ends. The `$LOG-CALL` schema MUST render for that call.
6. The disposition note MUST be present on `call.ringcx.notes` even when the log schema has no `note` field. A disposition call summary MUST be present as `aiNote` and `call.aiNote` for the `callDisposition` log, the same field RingEX uses for the AI note.
   A submitted disposition MUST be present as `call.ringcx.disposition` with both `id` and the disposition label as `name` on every log request for that call, including the `/log/call` page.
7. `leadViewerPath` MUST receive `{ lead, agentId }`. The View lead button MUST be hidden when the path is not registered.
8. Contact match requests MUST use plain phone numbers.
9. History log actions MUST use the same labels and disabled states as RingEX rows, and MUST be hidden when `callLoggerPath` is not registered. History rows MUST show the same logged status as RingEX rows, derived from call log matches.
10. `rc-adapter-ringcx-start-progressive-dial` MUST behave as **Start dialing** on the Leads tab, including the go-available prompt, which MUST bring the widget up. A refused start MUST post `rc-ringcx-progressive-dial-notify` with `running: false` and a `reason`.
11. A lead edit the server accepted MUST post `rc-ringcx-lead-notify` with `action: 'updated'` and the lead with the saved fields. A refused edit MUST NOT post it.

## Registry

`src/app/contracts/ringcx-third-party.contract.ts` lists the events, commands, request paths, registration options, and trigger types in this contract.

## Verification

- Contract registry completeness against the active sources.
- Adapter command routing when the RingCX bridge is absent.
- Log page resolution for `?source=ringcx`.
- Disposition-then-log failure isolation.
- Rule 11: `test/unit/ringCXLeadEdit.test.js` covers that a saved edit notifies the leads service with the saved fields, and that a refused one does not; `test/unit/ringCXProgressiveDialAdapter.test.js` covers relaying the `updated` action to the host page.

## Related Decision

- [ADR-0004: RingCX third-party protocol](../adr/0004-ringcx-third-party-protocol.md)
