# RingCX in Embeddable

<!-- md:version 3.1.0 -->

!!! info "Alpha"
    RingCX support is part of the [Embeddable 3.1.x alpha](../3.1.x.md). 

RingCX calls use the same `registerThirdPartyService` and `rc-*` protocol as RingEX calls. Read `call.source`. You do not need a second protocol.

## Enable RingCX

Add `enableRingCX=1` to the adapter.js or app.html URL. It is off by default and cannot be changed at runtime.

```js
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/3.1.x/adapter.js?clientId=YOUR_RINGCENTRAL_CLIENT_ID&enableRingCX=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

The **Agent** tab is shown when `enableRingCX` is on and the signed-in RingCentral user has a RingCX (Contact Center) account. The RingCentral login is reused for RingCX, so no second login or extra app scope is needed. A user who is not a RingCX agent gets an error when starting the session.

`rc-login-status-notify` reports `features.ringCX`, so your page can tell whether the user has RingCX.

The agent session does not start on first load. The user starts it from the Agent tab, or your page starts it with `RCAdapter.startRingCXAgentSession()`. After a session has reached `ready`, it is restored automatically when the widget reloads, until the agent ends it.

Optional parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `enableAgentScript` | off | Show RingCX agent scripts in the side panel during calls. We recommend using it with `enableSideWidget=1`. |
| `hideCallNote` | off | Hide the note field on the disposition form. With it on, the disposition step is skipped for calls that leave nothing for the agent to fill in. |

## Supporting RingCX in 3 steps

1. Read `call.source`. `'ringcx'` means a RingCX call. Absence, or `'ringcentral'`, means a RingEX call. RingCX-only fields are under `call.ringcx`.
2. Accept `triggerType: 'callDisposition'` in your `callLoggerPath` handler. That value means the widget logged the call automatically, with no log form shown. See [Call logging](#call-logging).
3. Optionally add `leadViewerPath` if agents should open a preview lead in your app.

Existing `callLoggerPath`, `contactMatchPath`, and `callLogEntityMatcherPath` registrations apply to RingCX calls with no other change.

## Events

RingCX calls use the existing call events:

| Event | When |
| --- | --- |
| `rc-call-ring-notify` | Inbound RingCX call is ringing. `call.source` is `'ringcx'`. An auto-answered inbound call still sends it, right before `rc-call-start-notify`. |
| `rc-call-start-notify` | RingCX call is connected. |
| `rc-call-end-notify` | RingCX call ended. It usually comes before the disposition. If the agent dispositions while the call is still connected, it comes after `rc-ringcx-call-disposed-notify`. |
| `rc-active-call-notify` | Sent on ring (inbound only), connect, and end, in the RingEX active call shape: `call.telephonyStatus` is `Ringing`, `CallConnected`, or `NoCall` (with `terminationType: 'final'`), and `call.startTime` is epoch milliseconds. `call.source` is `'ringcx'`. The RingEX leg that carries the RingCX audio is not reported. |

RingCX-only events:

| Event | Payload |
| --- | --- |
| `rc-ringcx-call-disposed-notify` | `{ type, call }` after the agent submits a disposition. `call.ringcx.disposition` and `call.ringcx.notes` are set, plus `call.aiNote` when the disposition form has a call summary. Calls without a disposition step do not send it. |
| `rc-ringcx-agent-session-notify` | `{ type, status, agent?, session?, permissions? }`. `status` is `idle`, `loading`, `authenticating`, `chooseAccount`, `sessionConfig`, `ready`, or `error`. Sent when the status, agent, or session configuration changes. |
| `rc-ringcx-agent-state-notify` | `{ type, state, auxState, pendingDisposition }` while the session is `ready`. `state` is the RingCX agent state, such as `AVAILABLE`, `ENGAGED`, or `ON-BREAK`. |
| `rc-ringcx-lead-notify` | `{ type, action, leads?, lead?, destination? }`. `action` is `loaded`, `passed`, or `dialed`; `dialed` is sent once the dial request is sent. Each lead is `{ leadId, externId, campaignId, firstName, lastName, destination, raw }`, where `raw` is the original RingCX lead. |

The integrated softphone runs on the RingEX WebPhone, so its status is `rc-webphone-connection-status-notify`.

`call.id` and `call.sessionId` are the same stable id: the RingCX call `uii`. A live call and its later history row have the same id. Use that id with `callLogEntityMatcherPath`.

Event `startTime` is an ISO-8601 string. The call-log request uses the host call logger envelope, so its `startTime` is epoch milliseconds, the same as a RingEX call.

## Commands

| Command | Payload | Effect |
| --- | --- | --- |
| `rc-adapter-new-call` | `{ phoneNumber, callWith: 'ringcx', callerId? }` | Places a RingCX call right away; `toCall` is not needed. Requires a ready agent session. `callerId` becomes the agent's manual dial caller ID. |
| `rc-adapter-control-call` | `{ callAction, callId, source: 'ringcx', options? }` | `answer`, `reject`, `hangup`, `hold`, `unhold`, `mute`, `unmute`, `record` or `startRecord`, `stopRecord`, and `dtmf` with `options.dtmf`. |
| `rc-adapter-ringcx-start-agent-session` | `{}` | Starts the Agent tab session. |
| `rc-adapter-ringcx-end-agent-session` | `{}` | Ends the session. Refused while a call or pending disposition is active. |
| `rc-adapter-ringcx-set-agent-state` | `{ state }` | Sets the working state and clears any aux state. |
| `rc-adapter-ringcx-dial-lead` | `{ lead, destination }` | Dials a preview lead. Pass the `raw` lead from `rc-ringcx-lead-notify` as `lead`. |

`rc-adapter-control-call` actions apply to the current RingCX call, as the Agent tab controls do. `hold`, `unhold`, `hangup`, and recording actions follow the call permissions. `answer`, `reject`, `mute`, `unmute`, and `dtmf` need the integrated softphone; `answer` and `reject` do nothing when no call is ringing there. A refused or failed action shows a message in the widget.

While a RingCX call is active, `rc-adapter-new-call` without `callWith: 'ringcx'` is refused and the widget asks the agent to finish the RingCX call first.

Commands that need a ready session are not ignored when the session is not ready. The widget shows a message and posts `rc-ringcx-agent-session-notify` with the current status.

`RCAdapter` helpers: `clickToCall(number, { callWith: 'ringcx', callerId })`, `startRingCXAgentSession()`, `endRingCXAgentSession()`, `setRingCXAgentState(state)`, `dialRingCXLead(lead, destination)`, and `controlCall(action, id, { source: 'ringcx' })`.

### Message requests

Send these as `rc-adapter-message-request`, the same as other [message requests](./api.md#schedule-a-meeting). The reply is `rc-adapter-message-response` with `responseId` equal to your `requestId`.

```js
const requestId = Date.now().toString();
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-message-request',
  requestId,
  path: '/ringcx/agent-session',
}, '*');

window.addEventListener('message', (e) => {
  const data = e.data;
  if (data && data.type === 'rc-adapter-message-response' && data.responseId === requestId) {
    console.log(data.response); // { status, agent, session, permissions }
  }
});
```

| Path | Body | Response |
| --- | --- | --- |
| `/ringcx/agent-session` | - | `{ status, agent, session, permissions }`. Only `{ status }` before RingCX has loaded. |
| `/ringcx/dispositions` | `{ callId }` | `{ callId, dispositions }`. `{ error }` when the session is not ready. |
| `/get-call-log` | `{ sessionId, source? }` | `{ call }`. Accepts a RingCX id in `sessionId`. |

## Call logging

Disposition and call logging are separate.

- Disposition stays in the Agent tab. It is submitted to RingCX before any CRM log.
- Call logging uses `callLoggerPath` and the host log page at `/log/call/<id>?source=ringcx`.

When `showLogModal` is false:

- Submitting a disposition logs the call right away with `triggerType: 'callDisposition'` and `redirect: true`. The widget does not open another page. Your `callLoggerPath` handler decides from its own auto-log setting whether to open the CRM record.
- A call without a disposition step (only possible with `hideCallNote`) is logged the same way when it ends, but only if auto log is on in the widget settings.

When `showLogModal` is true and `callLoggerPath` is registered, the host log page opens once the call has ended, and your `$LOG-CALL` schema renders there. If the agent dispositions while the call is still connected, the page opens when the call ends.

The log page closes itself once your `callLoggerPath` responds to a `logForm` save, the same as for RingEX calls. To close it or the disposition page from your side, use `rc-adapter-navigate-to` with `path: 'goBack'` or a target path. Going back never reopens a disposition that was already submitted for an ended call; the agent lands on the dialer instead.

A failing `callLoggerPath` does not leave the agent in Pending Disposition. The call stays dispositioned and the log can be retried from history.

The disposition is not a field of the log form. It arrives as `call.ringcx.disposition`. The disposition note arrives twice: `call.ringcx.notes`, and the prefilled `note` on the default log page. A schema without a `note` field still receives it on `call.ringcx.notes`. The call summary from the disposition form, AI generated or agent edited, arrives as `aiNote` on both the request and `call.aiNote`, the same field RingEX calls use for the AI note. It is absent when summaries are off for the session.

History rows use the host actions **Log call**, **Edit log**, and **View log**, with the same labels and `callLoggerTitle` as RingEX rows. They send `triggerType` `createLog`, `editLog`, and `viewLog`. They are hidden when no `callLoggerPath` is registered. The Logged / Unlogged status is derived from `callLogEntityMatcherPath` results, as for RingEX rows.

History rows also show **Refresh contact** and the `callAction` buttons registered with `buttonEventPath`, as RingEX rows do. A `callAction` click sends the row as `resource` in the same shape as the call events, so `resource.source` is `'ringcx'` and RingCX fields are under `resource.ringcx`.

RingCX history stays in the Agent tab. `/unlogged-calls` does not include RingCX calls.

## Leads

Register `leadViewerPath` to show **View lead** on a preview lead. The request body is `{ lead, agentId }`, where `lead` is the original RingCX lead (the same object as `raw` in `rc-ringcx-lead-notify`). The button is hidden when the path is not registered.

## Contact matching

`contactMatchPath` receives the same body as for RingEX calls, `{ phoneNumbers, callerIds, triggerFrom? }`, with plain phone numbers. The old phone-plus-call-type match key from the standalone RingCX Embeddable is not used. `callType` is on `call.ringcx`.

## Migrating from the standalone RingCX Embeddable

| Standalone | This app |
| --- | --- |
| `rc-ev-ringCall` | `rc-call-ring-notify` |
| `rc-ev-newCall` | `rc-call-start-notify` |
| `rc-ev-endCall` | `rc-call-end-notify` |
| `rc-ev-sip*` | `rc-webphone-connection-status-notify` |
| `rc-ev-clickToDial` | `rc-adapter-new-call` with `callWith: 'ringcx'` |
| `rc-ev-dialLead` | `rc-adapter-ringcx-dial-lead` |
| `rc-ev-loadLeads`, `rc-ev-manualPassLead`, `rc-ev-callLead` | `rc-ringcx-lead-notify` with `action` `loaded`, `passed`, or `dialed` |
| `rc-ev-logout` | `rc-adapter-ringcx-end-agent-session` |
| `rc-ev-setEnvironment` | `evServer` parameter |
| `rc-ev-register` | `rc-adapter-register-third-party-service` |
| `rc-ev-matchContacts` | `contactMatchPath` |
| `rc-ev-matchCallLogs` | `callLogEntityMatcherPath` |
| `rc-ev-logCall` | `callLoggerPath` |
| `rc-ev-viewLead` | `leadViewerPath` |
| `rc-ev-sideWidgetOpenNotify` | `rc-adapter-side-drawer-open-notify` |
| `rc-ev-setSideWidgetExtended` | Not carried. The host controls the drawer. |