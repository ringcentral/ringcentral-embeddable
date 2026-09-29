# RingCX in Embeddable

RingCX calls use the same `registerThirdPartyService` and `rc-*` protocol as RingEX calls. Read `call.source`. You do not need a second protocol.

The Agent tab is available when the signed-in user has the Contact Center permission and `enableRingCX` is on. The agent session does not start at load. The user starts it from the Agent tab, or a host page starts it with `RCAdapter.startRingCXAgentSession()`.

## Supporting RingCX in 3 steps

1. Read `call.source`. `'ringcx'` means a RingCX call. Absence, or `'ringcentral'`, means a RingEX call. RingCX-only fields are under `call.ringcx`.
2. Accept `triggerType: 'callDisposition'`. That value means the log was created when a RingCX disposition was submitted and no log form was shown.
3. Optionally add `leadViewerPath` if agents should open a preview lead in your app.

Existing `callLoggerPath`, `contactMatchPath`, and `callLogEntityMatcherPath` registrations apply to RingCX calls with no other change.

## Events

RingCX calls use the existing call events:

| Event | When |
| --- | --- |
| `rc-call-ring-notify` | Inbound RingCX call is ringing. `call.source` is `'ringcx'`. An auto-answered inbound call still sends it, right before `rc-call-start-notify`. |
| `rc-call-start-notify` | RingCX call is connected. |
| `rc-call-end-notify` | RingCX call ended, before disposition. |
| `rc-active-call-notify` | Sent on ring (inbound only), connect, and end, in the RingEX active call shape: `call.telephonyStatus` is `Ringing`, `CallConnected`, or `NoCall` (with `terminationType: 'final'`), and `call.startTime` is epoch milliseconds. `call.source` is `'ringcx'`. The RingEX leg that carries the RingCX audio is not reported. |

RingCX-only events:

| Event | Payload |
| --- | --- |
| `rc-ringcx-call-disposed-notify` | `{ type, call }` after the agent submits a disposition. `call.ringcx.disposition` and `call.ringcx.notes` are set, plus `call.aiNote` when the disposition form has a call summary. Calls without a disposition step do not send it. |
| `rc-ringcx-agent-session-notify` | `{ type, status, agent?, session?, permissions? }`. `status` is `idle`, `loading`, `authenticating`, `chooseAccount`, `sessionConfig`, `ready`, or `error`. Sent when the status, agent, or session configuration changes. |
| `rc-ringcx-agent-state-notify` | `{ type, state, auxState, pendingDisposition }` while the session is `ready`. `state` is the RingCX agent state, such as `AVAILABLE`, `ENGAGED`, or `ON-BREAK`. |
| `rc-ringcx-lead-notify` | `{ type, action, leads?, lead?, destination? }`. `action` is `loaded`, `passed`, or `dialed`; `dialed` is sent once the dial request is sent. Each lead is `{ leadId, externId, campaignId, firstName, lastName, destination, raw }`. |

The integrated softphone runs on the RingEX WebPhone, so its status is `rc-webphone-connection-status-notify`.

`call.id` and `call.sessionId` are the same stable id. For a live leg that id is `uii$sessionId`. A history row this browser did not handle uses `segmentId$$uii`. Use that id with `callLogEntityMatcherPath`.

Event `startTime` is an ISO-8601 string. The call-log request uses the host call logger envelope, so its `startTime` is epoch milliseconds, the same as a RingEX call.

## Commands

| Command | Payload | Effect |
| --- | --- | --- |
| `rc-adapter-new-call` | `{ phoneNumber, toCall: true, callWith: 'ringcx', callerId? }` | Places a RingCX call. Requires a ready agent session. |
| `rc-adapter-control-call` | `{ callAction, callId, source: 'ringcx', options? }` | `answer`, `reject`, `hangup`, `hold`, `unhold`, `mute`, `unmute`, `record` or `startRecord`, `stopRecord`, and `dtmf` with `options.dtmf`. |
| `rc-adapter-ringcx-start-agent-session` | `{}` | Starts the Agent tab session. |
| `rc-adapter-ringcx-end-agent-session` | `{}` | Ends the session. Refused while a call or pending disposition is active. |
| `rc-adapter-ringcx-set-agent-state` | `{ state }` | Sets the working state. |
| `rc-adapter-ringcx-dial-lead` | `{ lead, destination }` | Dials a preview lead. |

`callId` selects the leg only for `hangup`. Other actions apply to the current RingCX call, as the Agent tab controls do. `hold`, `unhold`, `hangup`, and recording actions follow the call permissions. `mute`, `unmute`, and `dtmf` need the integrated softphone. A refused, failed, or unsupported action shows a message in the widget.

Commands that need a ready session are not ignored when the session is not ready. The widget shows a message and posts `rc-ringcx-agent-session-notify` with the current status.

`RCAdapter` helpers: `clickToCall(number, { callWith: 'ringcx', callerId, toCall: true })`, `startRingCXAgentSession()`, `endRingCXAgentSession()`, `setRingCXAgentState(state)`, `dialRingCXLead(lead, destination)`, and `controlCall(action, id, { source: 'ringcx' })`.

Message requests:

| Path | Response |
| --- | --- |
| `/ringcx/agent-session` | `{ status, agent, session, permissions }` |
| `/ringcx/dispositions` | `{ callId, dispositions }` |
| `/get-call-log` | Accepts a RingCX id in `sessionId`. |

## Call logging

Disposition and call logging are separate.

- Disposition stays in the Agent tab. It is submitted to RingCX before any CRM log.
- Call logging uses `callLoggerPath` and the host log page at `/log/call/<id>?source=ringcx`.

If `showLogModal` is false, submitting a disposition logs immediately with `triggerType: 'callDisposition'` and `redirect: true`. The widget does not open another page; your `callLoggerPath` handler decides from its own auto-log setting whether to open the CRM record. If `showLogModal` is true, the host log page opens after disposition and your `$LOG-CALL` schema renders there.

The log page closes itself once your `callLoggerPath` responds to a `logForm` save, the same as for RingEX calls. To close it or the disposition page from your side, use `rc-adapter-navigate-to` with `path: 'goBack'` or a target path. Going back never reopens a disposition that was already submitted for an ended call; the agent lands on the dialer instead.

A failing `callLoggerPath` does not leave the agent in Pending Disposition. The call stays dispositioned, a toast is shown, and the log can be retried from history.

The disposition is not a field of the log form. It arrives as `call.ringcx.disposition`. The disposition note arrives twice: `call.ringcx.notes`, and the prefilled `note` on the default log page. A schema without a `note` field still receives it on `call.ringcx.notes`. The call summary from the disposition form, AI generated or agent edited, arrives as `aiNote` on both the request and `call.aiNote`, the same field RingEX calls use for the AI note. It is absent when summaries are off for the session.

History rows use the host actions **Log call**, **Edit log**, and **View log**, with the same labels and `callLoggerTitle` as RingEX rows. They are hidden when no `callLoggerPath` is registered. The Logged / Unlogged status is derived from `callLogEntityMatcherPath` results, as for RingEX rows.

History rows also show **Refresh contact** and the `callAction` buttons registered with `buttonEventPath`, as RingEX rows do. A `callAction` click sends the row as `resource` in the same shape as the call events, so `resource.source` is `'ringcx'` and RingCX fields are under `resource.ringcx`.

RingCX history stays in the Agent tab. `/unlogged-calls` does not include RingCX calls.

## Leads

Register `leadViewerPath` to show **View lead** on a preview lead. The request body is `{ lead, agentId }`. The button is hidden when the path is not registered.

## Contact matching

`contactMatchPath` receives `{ phoneNumbers }` with plain phone numbers. The old phone-plus-call-type match key is not used. `callType` is on `call.ringcx`.

## Migrating from the standalone RingCX Embeddable

| Standalone | This app |
| --- | --- |
| `rc-ev-ringCall` | `rc-call-ring-notify` |
| `rc-ev-newCall` | `rc-call-start-notify` |
| `rc-ev-endCall` | `rc-call-end-notify` |
| `rc-ev-sip*` | `rc-webphone-connection-status-notify` |
| `rc-ev-clickToDial` | `rc-adapter-new-call` with `callWith: 'ringcx'` |
| `rc-ev-dialLead` | `rc-adapter-ringcx-dial-lead` |
| `rc-ev-register` | `rc-adapter-register-third-party-service` |
| `rc-ev-matchContacts` | `contactMatchPath` |
| `rc-ev-matchCallLogs` | `callLogEntityMatcherPath` |
| `rc-ev-logCall` | `callLoggerPath` |
| `rc-ev-viewLead` | `leadViewerPath` |
| `rc-ev-sideWidgetOpenNotify` | `rc-adapter-side-drawer-open-notify` |
| `rc-ev-setSideWidgetExtended` | Not carried. The host controls the drawer. |

A sample host page is in `docs/assets/ringcx-sample-host.html`.
