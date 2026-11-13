# RingCX in Embeddable

<!-- md:version 3.1.0 -->

!!! info "Beta"
    RingCX support is part of the [Embeddable 3.1.x beta](../3.1.x.md).

RingCX is RingCentral's contact center product. With RingCX enabled, agents handle RingCX calls in Embeddable next to their RingEX (RingCentral phone) calls.

RingCX calls use the same events, commands, and [`registerThirdPartyService`](index.md) API as RingEX calls. You do not need a second protocol. To tell the two apart, check `call.source`: it is `'ringcx'` for a RingCX call.

## Quick start

### 1. Enable RingCX

Add `enableRingCX=1` to the adapter.js or app.html URL. It is off by default and cannot be changed at runtime.

```html
<script>
  (function() {
    var rcs = document.createElement("script");
    rcs.src = "https://apps.ringcentral.com/integration/ringcentral-embeddable/3.1.x/adapter.js?clientId=YOUR_RINGCENTRAL_CLIENT_ID&enableRingCX=1";
    var rcs0 = document.getElementsByTagName("script")[0];
    rcs0.parentNode.insertBefore(rcs, rcs0);
  })();
</script>
```

The **Agent** tab appears when the signed-in RingCentral user also has a RingCX account. RingCX reuses the RingCentral login, so there is no second login and no extra app scope. [`rc-login-status-notify`](events.md#login-status-event) reports `features.ringCX`, so your page can tell whether the user has RingCX.

Optional parameters:

| Parameter | Default | Description |
| --- | --- | --- |
| `enableAgentScript` | off | Show RingCX agent scripts in the side panel during calls. Use it with `enableSideWidget=1`. |

### 2. Tell RingCX calls apart

In every call event and logger request, read `call.source`:

- `'ringcx'`: a RingCX call. RingCX-only fields are under `call.ringcx`.
- `'ringcentral'`, or no `source`: a RingEX call.

Your existing [`callLoggerPath`](call-logging.md), [`contactMatchPath`](address-book.md#show-matched-contact-in-the-call-history-or-incoming-call-page), and [`callLogEntityMatcherPath`](call-logging.md#add-call-log-entity-matcher) registrations apply to RingCX calls with no other change.

### 3. Handle RingCX call logging

The simplest path: accept `triggerType: 'callDisposition'` in your `callLoggerPath` handler. The widget sends it after the agent submits a disposition, and no log form is shown.

```js
window.addEventListener('message', function (e) {
  var data = e.data;
  if (!data || data.type !== 'rc-post-message-request' || data.path !== '/callLogger') {
    return;
  }
  var body = data.body;
  if (body.call.source === 'ringcx' && body.triggerType === 'callDisposition') {
    // body.call.ringcx.disposition: the disposition the agent picked
    // body.call.ringcx.notes: the disposition notes
    // body.redirect: true. Open the CRM record only if your own auto-log setting says so.
    saveCallToCrm(body.call); // your code
  }
  document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
    type: 'rc-post-message-response',
    responseId: data.requestId,
    response: { data: 'ok' },
  }, '*');
});
```

To show your own log form on the agent's wrap-up page instead, see [Call logging](#call-logging). That is the recommended setup.

### 4. Optional: open leads in your app

Register `leadViewerPath` to add **View lead** to the **Lead** tab. See [Lead tab](#lead-tab).

## Concepts

| Term | Meaning |
| --- | --- |
| Agent tab | The widget tab for RingCX: agent state, calls, leads, and RingCX call history. |
| Agent session | The agent's RingCX login for this widget. Calls and commands need a session in the `ready` status. |
| Agent state | The agent's RingCX availability, such as `AVAILABLE`, `ENGAGED`, or `ON-BREAK`. An **aux state** is a named sub-state of a state, such as a break reason. |
| Integrated softphone | RingCX audio in the browser. It runs on the WebPhone: RingCX places a web phone call leg that carries the audio. That leg is not reported as a separate call. |
| Disposition | The outcome the agent records after a RingCX call, such as "Sale" or "No answer", plus optional notes. It is saved to RingCX. Until it is submitted, the agent is in **Pending Disposition**. |
| Wrap-up page | The page in the Agent tab's side panel where the agent submits the disposition and, optionally, your call log form. |
| Lead | A contact that a RingCX campaign assigns to the agent to call. |
| Dial group | The RingCX setting that decides how the agent dials leads. In a **preview** dial group, the agent picks a lead and dials it. In a **progressive** dial group, the widget dials leads one by one. |

### Call lifecycle

1. **Start the session.** The session does not start on first load. The agent starts it from the Agent tab, or your page calls `RCAdapter.startRingCXAgentSession()`. Wait for `rc-ringcx-agent-session-notify` with `status: 'ready'`. After a session has reached `ready`, it is restored automatically when the widget reloads, until the agent ends it. A user who is not a RingCX agent gets an error here.
2. **Go available.** The agent sets the state to `AVAILABLE`, from the Agent tab or with `rc-adapter-ringcx-set-agent-state`.
3. **Call.** An inbound call rings (`rc-call-ring-notify`), or the agent dials a number or a lead. The call connects (`rc-call-start-notify`) and later ends (`rc-call-end-notify`).
4. **Wrap up.** The agent submits the disposition, and your log form if there is one, on the wrap-up page (`rc-ringcx-call-disposed-notify`). See [Call logging](#call-logging).
5. **Repeat.** After a lead call, the widget goes back to the Leads tab.

`rc-call-end-notify` usually comes before the disposition. If the agent submits the disposition while the call is still connected, it comes after `rc-ringcx-call-disposed-notify`.

### Call ids and times

- `call.id` and `call.sessionId` are the same stable id: the RingCX call `uii` (RingCX's unique call id). A live call and its later history row have the same id. Use it with `callLogEntityMatcherPath`.

!!! warning "Time formats differ"
    - Call events (`rc-call-*-notify`, `rc-ringcx-*-notify`): `startTime` is an ISO-8601 string.
    - `rc-active-call-notify`: `startTime` is epoch milliseconds, as for RingEX calls.
    - `callLoggerPath` requests: `startTime` is epoch milliseconds, as for RingEX calls.

## Events

### Call events

RingCX calls use the existing call events, with `call.source: 'ringcx'`. The table lists only what is specific to RingCX calls; follow each link for the full event and payload.

| Event | When |
| --- | --- |
| [`rc-call-ring-notify`](events.md#web-phone-call-event) | An inbound RingCX call is ringing. An auto-answered inbound call still sends it, right before `rc-call-start-notify`. |
| [`rc-call-start-notify`](events.md#web-phone-call-event) | The RingCX call is connected. |
| [`rc-call-end-notify`](events.md#web-phone-call-event) | The RingCX call ended. See [Call lifecycle](#call-lifecycle) for its order with the disposition. |
| [`rc-active-call-notify`](events.md#active-call-event) | Sent on ring (inbound only), connect, and end, in the RingEX active call shape. See below. |
| [`rc-call-drop-voicemail-notify`](../config/voicemail-drop.md#voicemail-drop-event) | The status of a voicemail drop on the call changed. `call.voicemailDropStatus` is set. |
| [`rc-webphone-connection-status-notify`](events.md#web-phone-connection-status-event) | The integrated softphone's connection status. It runs on the WebPhone, so there is no separate RingCX event. |

For `rc-active-call-notify`, `call.telephonyStatus` is `Ringing`, `CallConnected`, or `NoCall` (with `terminationType: 'final'`), and `call.startTime` is epoch milliseconds.

### RingCX-only events

| Event | When |
| --- | --- |
| [`rc-ringcx-agent-session-notify`](#rc-ringcx-agent-session-notify) | The session status, agent, or session configuration changed. |
| [`rc-ringcx-agent-state-notify`](#rc-ringcx-agent-state-notify) | The agent state changed, while the session is `ready`. |
| [`rc-ringcx-call-disposed-notify`](#rc-ringcx-call-disposed-notify) | The agent submitted a disposition. |
| [`rc-ringcx-lead-notify`](#rc-ringcx-lead-notify) | Leads were loaded, passed, dialed, or updated. |
| [`rc-ringcx-progressive-dial-notify`](#rc-ringcx-progressive-dial-notify) | The progressive dialer started, stopped, moved to another step, or refused to start. |

#### rc-ringcx-agent-session-notify

```js
{
  type: 'rc-ringcx-agent-session-notify',
  status: 'ready', // idle | loading | authenticating | chooseAccount | sessionConfig | ready | error
  agent: { ... },       // optional
  session: { ... },     // optional
  permissions: { ... }, // optional, e.g. permissions.progressiveEnabled
}
```

`chooseAccount` and `sessionConfig` mean the agent must pick a RingCX account or configure the session in the Agent tab.

#### rc-ringcx-agent-state-notify

```js
{
  type: 'rc-ringcx-agent-state-notify',
  state: 'AVAILABLE', // RingCX agent state, e.g. AVAILABLE, ENGAGED, ON-BREAK
  auxState: '...',
  pendingDisposition: false, // true while a disposition is still to be submitted
}
```

#### rc-ringcx-call-disposed-notify

`{ type, call }`, sent after the agent submits a disposition. `call.ringcx.disposition` and `call.ringcx.notes` are set, plus `call.aiNote` when the disposition form has a call summary. Calls without a disposition step do not send it.

#### rc-ringcx-lead-notify

```js
{
  type: 'rc-ringcx-lead-notify',
  action: 'loaded', // loaded | passed | dialed | updated
  leads: [ ... ],   // optional
  lead: { ... },    // optional
  destination: '...', // optional
}
```

- `dialed` is sent once the dial request is sent.
- `updated` is sent once the agent saved an edit to the lead, with the saved fields on `lead`.

Each lead has this shape:

```js
{ leadId, externId, campaignId, firstName, lastName, destination, raw }
```

`raw` is the original RingCX lead. A lead dialed by the progressive dialer has no `destination`, because the server picks the number.

#### rc-ringcx-progressive-dial-notify

```js
{
  type: 'rc-ringcx-progressive-dial-notify',
  running: true,
  phase: 'countdown', // idle | connecting | fetching | countdown | dialing | waiting | noLeads
  nextDialAt: 1731300000000, // epoch ms of the next dial (countdown) or lead fetch (noLeads)
  lead: { ... },  // optional: the lead the countdown dials, in the rc-ringcx-lead-notify shape
  reason: null,   // set when the dialer stopped or did not start
}
```

It is not sent for every countdown second. `reason` is one of `stopped`, `notProgressive`, `busy`, `notAvailable`, `offhookFailed`, `offhookEnded`, `manualOutdial`, `inboundCall`, `agentState`, `dialGroupChanged`, `dialFailed`, or `logout`. `offhookFailed` and `offhookEnded` mean the agent's line could not be connected, or was disconnected. See [Progressive dialing](#progressive-dialing).

## Commands

Each command has an `RCAdapter` helper. `rc-adapter-new-call` and `rc-adapter-control-call` are the existing commands; the table lists only what is specific to RingCX calls.

| Command | `RCAdapter` helper | Payload | Effect |
| --- | --- | --- | --- |
| `rc-adapter-ringcx-start-agent-session` | `startRingCXAgentSession()` | `{}` | Starts the agent session. |
| `rc-adapter-ringcx-end-agent-session` | `endRingCXAgentSession()` | `{}` | Ends the session. Refused while a call or pending disposition is active. |
| `rc-adapter-ringcx-set-agent-state` | `setRingCXAgentState(state, auxState?)` | `{ state, auxState? }` | Sets the agent state. See below. |
| [`rc-adapter-new-call`](api.md#open-the-dialer-and-start-a-call) | `clickToCall(number, { callWith: 'ringcx', callerId })` | `{ phoneNumber, callWith: 'ringcx', callerId? }` | Places a RingCX call right away; `toCall` is not needed. `callerId` becomes the agent's manual dial caller ID. |
| [`rc-adapter-control-call`](api.md#active-call-control) | `controlCall(action, id, { source: 'ringcx' })` | `{ callAction, callId, source: 'ringcx', options? }` | Controls the current RingCX call. `source` can be left out while a RingCX call is active. See below. |
| `rc-adapter-ringcx-dial-lead` | `dialRingCXLead(lead, destination)` | `{ lead, destination }` | Dials a preview lead. See below. |
| `rc-adapter-ringcx-start-progressive-dial` | `startRingCXProgressiveDial()` | `{}` | Same as **Start dialing** on the Leads tab. Needs `permissions.progressiveEnabled`. When the agent is not available, the widget opens on the Leads tab and asks the agent to go available. |
| `rc-adapter-ringcx-stop-progressive-dial` | `stopRingCXProgressiveDial()` | `{}` | Same as **Stop dialing** on the Leads tab. |

!!! note "Refused commands"
    Commands that need a ready session are not silently ignored when the session is not ready. The widget shows a message to the agent and posts `rc-ringcx-agent-session-notify` with the current status. Other refused or failed commands also show a message to the agent.

**Set agent state.** `auxState` picks one of the agent's aux states for `state`, as `rc-ringcx-agent-state-notify` reports them. Without it, the first aux state listed for `state` is used. A state the agent cannot choose is refused.

**Control call.** Actions apply to the current RingCX call, as the Agent tab controls do. While a RingCX call is active no RingEX call can be placed, so `rc-adapter-control-call` without `source` also controls the RingCX call, unless `callId` is the id of a RingEX call. Otherwise, send `source: 'ringcx'`.

| `callAction` | Requirement |
| --- | --- |
| `hold`, `unhold`, `hangup`, `record` or `startRecord`, `stopRecord` | Follow the agent's call permissions. |
| `mute`, `unmute` | The integrated softphone. |
| `answer`, `reject` | The integrated softphone, with a call ringing there. |
| `dtmf` | The integrated softphone, and `options.dtmf`. |
| `transfer` | The agent's transfer permission for the call, and `options.transferNumber`. See below. |

**Transfer.** `options.transferNumber` is the destination phone number, the same as a number typed on the **Manual entry** tab of the transfer page. `options.transferType` is `cold` (default), which hands the call over right away, or `warm`, which calls the destination first while the customer stays on the call (on hold when the account holds warm transfers). A number in a country the agent cannot transfer to is refused.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-control-call',
  callAction: 'transfer',
  source: 'ringcx',
  options: {
    transferNumber: '+16505550100',
    transferType: 'warm', // or 'cold' (default)
  },
}, '*');
```

**Dial lead.** `lead` can be the lead from `rc-ringcx-lead-notify`, its `raw` lead, or `{ leadId, campaignId }`. With only `leadId`, the lead must be in the agent's current lead list. `destination` must be one of the lead's numbers, in its national or E.164 form; another number is not dialed.

**New call.** `rc-adapter-new-call` with `callWith: 'ringcx'` needs a ready session. While a RingCX call is active, `rc-adapter-new-call` without `callWith: 'ringcx'` is refused, and the widget asks the agent to finish the RingCX call first.

### Message requests

These are request/response calls. Send `rc-adapter-message-request`, the same as other [message requests](./api.md#schedule-a-meeting). The reply is `rc-adapter-message-response` with `responseId` equal to your `requestId`.

| Path | Body | Response |
| --- | --- | --- |
| `/ringcx/agent-session` | - | `{ status, agent, session, permissions }`. Only `{ status }` before RingCX has loaded. |
| `/ringcx/dispositions` | `{ callId }` | `{ callId, dispositions }`: the dispositions the agent can pick for the call. `{ error }` when the session is not ready. |
| `/get-call-log` | `{ sessionId, source? }` | `{ call }`. Accepts a RingCX id in `sessionId`. |

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

## Call logging

After a RingCX call, the agent wraps it up on one page in the Agent tab's side panel: the RingCX disposition and your call log form, with one **Submit**. The disposition is always saved to RingCX first; the CRM log follows.

### Choose a logging mode

What you receive depends on your service registration:

| Your registration | Requests to `callLoggerPath` | Your form on the wrap-up page |
| --- | --- | --- |
| `callLoggerPrepareLogForm: true` (recommended) | `prepareLogForm` when the page opens, then `logForm` on **Submit** | Yes, during the call or after it ends |
| [`showLogModal: true`](call-logging.md#add-call-logger-modal) | `logForm` on **Submit** | Yes, once the call has ended |
| Neither (only `callLoggerPath`) | `callDisposition`, sent automatically | No, unless you open it yourself |

`rc-ringcx-call-disposed-notify` is posted in every mode.

### Recommended: `callLoggerPrepareLogForm: true`

```js
window.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'MyCRM',
    callLoggerPath: '/callLogger',
    callLogPageInputChangedEventPath: '/callLogger/inputChanged',
    callLoggerPrepareLogForm: true,
  },
}, '*');
```

1. When the wrap-up page opens, during the call or after it ends, the widget sends `callLoggerPath` once with `triggerType: 'prepareLogForm'`. `call.ringcx.notes` holds the notes typed so far.
2. Post your form with [`rc-adapter-update-call-log-page`](custom-call-log-page.md), then answer `{ data: 'ok' }`. Do not navigate and do not log yet.
    - If you have no form for this call, answer `{ data: 'ok', noLogForm: '<short reason>' }`. The page shows the reason instead of the form.
3. On **Submit**, the widget sends `triggerType: 'logForm'` with the form data, as the log page does.
    - Answer `{ error: '<message>' }` when the save failed. The disposition stays saved, and the page keeps the input with **Retry** and **Log later**.
    - No answer within 15 seconds counts as a failure.

You never receive `callDisposition` in this mode. The form's `note` field follows the disposition **Notes** until the agent edits it; changes reach [`callLogPageInputChangedEventPath`](custom-call-log-page.md) with `keys: ['note']`.

### `showLogModal: true`

Without `callLoggerPrepareLogForm`, your current `$LOG-CALL` form, or the default form, shows on the wrap-up page once the call has ended. **Submit** sends `logForm`. No `callDisposition` is sent.

### Only `callLoggerPath`

- Submitting a disposition logs the call right away with `triggerType: 'callDisposition'` and `redirect: true`, whatever the widget's auto log setting. The widget does not open another page. Your handler decides from its own auto-log setting whether to open the CRM record.
- A call without a disposition step is logged the same way when it ends, but only if **Auto log** is on in the widget settings.
- If you open your own log page for the call with [`rc-adapter-navigate-to`](api.md#navigate-to-arbitrary-path) and `/log/call/<id>?source=ringcx`, your form shows on the call's wrap-up page instead of a separate page.

### What the wrap-up page shows

- With both a disposition and your form: two pill tabs, **Disposition** and your service's `displayName` (else its `name`).
- A call without a disposition step: only your form, in a tab named **Log call**.
- A call with dispositions and no log form: only the disposition.
- When only your form is left to save, its button uses your `uiSchema.submitButtonOptions.submitText`, as the log page does, else **Save**.

### Where the disposition data arrives

- **Disposition:** `call.ringcx.disposition`. It is not a field of the log form.
- **Disposition notes:** `call.ringcx.notes`, and the prefilled `note` on the default log page. A schema without a `note` field still receives it on `call.ringcx.notes`.
- **Call summary** (AI generated or agent edited): `aiNote` on the request and `call.aiNote`, the same field RingEX calls use for the AI note. It is absent when summaries are off for the session.

### Edge cases

- **Submit during the call.** The disposition is saved right away. The `logForm` save is sent when the call ends, so the CRM gets the real duration. The wrap-up page comes back only when that save fails, or when the agent submitted before your form was shown.
- **Closing the page from your side.** Use `rc-adapter-navigate-to` with `path: 'goBack'` or a target path. Going back never reopens a disposition that was already submitted for an ended call; the agent lands on the dialer instead.
- **A failing `callLoggerPath`.** The agent is not left in Pending Disposition. The call stays dispositioned and the log can be retried from history. When the widget logs the call itself (after a disposition, at call end, or from a history action), a `callLoggerPath` that does not respond within 15 seconds shows a message in the widget.

### Call history

RingCX history stays in the Agent tab. `/unlogged-calls` does not include RingCX calls.

- History rows use the host actions **Log call**, **Edit log**, and **View log**, with the same labels and `callLoggerTitle` as RingEX rows. They send `triggerType` `createLog`, `editLog`, and `viewLog`, and are hidden when no `callLoggerPath` is registered.
- The Logged / Unlogged status comes from `callLogEntityMatcherPath` results, as for RingEX rows.
- Rows also show **Refresh contact** and the `callAction` buttons registered with `buttonEventPath`. A `callAction` click sends the row as `resource` in the call event shape, so `resource.source` is `'ringcx'` and RingCX fields are under `resource.ringcx`.

## Contact matching

[`contactMatchPath`](address-book.md#show-matched-contact-in-the-call-history-or-incoming-call-page) receives the same body as for RingEX calls, `{ phoneNumbers, callerIds, triggerFrom? }`, with plain phone numbers. The phone-plus-call-type match key of the standalone RingCX Embeddable is not used. The call type is on `call.ringcx.callType`.

## Leads

The agent gets leads on the **Leads** tab of the Agent tab. Your page follows them with `rc-ringcx-lead-notify` and dials them with `rc-adapter-ringcx-dial-lead`.

- After a call dialed from a lead, preview or progressive, the widget goes back to the Leads tab once the call and its disposition are done.
- A number of a fetched lead that was already dialed cannot be dialed again, as in the standalone RingCX app.

### Lead tab

The side panel's **Lead** tab shows a lead's name, numbers, and details. It opens:

- With each answered call that has a lead ID, next to the agent script and agent assistant. The script stays the active tab; the Lead tab is active only when the call has no script.
- When the agent selects **View lead** on the Leads tab or on the disposition page.

The agent can dial a number from the Lead tab under the same rules as the Leads tab, except in progressive dial mode. A call's Lead tab closes once the call and its disposition are done.

The Lead tab header has these actions:

| Action | Shown when | Effect |
| --- | --- | --- |
| **Edit** | The lead's campaign lets agents update leads. | Opens an **Update lead** form. Saving updates the lead in RingCX and sends `rc-ringcx-lead-notify` with `action: 'updated'`. |
| **Manual pass** | The lead is from the Leads tab and the agent may pass leads. | Opens a **Manual pass** form. Passing sends `rc-ringcx-lead-notify` with `action: 'passed'`. |
| **View lead** | You registered `leadViewerPath`. | Sends your `leadViewerPath` a request, so you can open the lead in your app. |

When the agent's RingCX permissions include lead history, the Lead tab also shows the lead's past dial attempts.

**`leadViewerPath` request body:** `{ lead, agentId }`.

- For a lead from the Leads tab, `lead` is the original RingCX lead, the same object as `raw` in `rc-ringcx-lead-notify`.
- For a call's lead, `lead` is the lead data from the call, merged with the matching Leads tab lead when there is one.

#### Lead tab details

- Details include source, lead state, passes, contact fields, IDs, aux data with the campaign's labels, and extra data. A field that holds a RingCX recording URL plays as audio.
- The call screen's side panel button lists the Lead tab with the other side panel tabs, and brings back any that are closed. On the disposition page, **View lead** brings back the call's Lead tab.
- A lead opened from the Leads tab switches to its call once that call is answered, and closes when the lead is passed or no longer fetched.
- **Update lead** edits contact fields, aux data, and numbers, one per line. Up to 6 numbers are kept, and each must be a valid number; national numbers are read as US numbers. When the campaign lets agents update everything but the numbers, the numbers cannot be changed.
- **Manual pass** follows the same rules as the Leads tab. The form closes when the lead is passed or no longer fetched, or when a RingCX call starts.
- Lead history loads when the agent selects **Show history**, then refreshes with **Refresh**. Each attempt shows its disposition and date in the agent's time zone, then its pass number, agent, agent disposition, and notes. For an attempt that left a voicemail, the notes list the audio that was played, grouped by audio library.
- In the Agent tab's history, a past lead call shows **Call** (disposition, call state, DNIS, termination party and reason), **Lead** (the lead as the call recorded it), and **History** (with lead history permission) tabs. Calls that are not lead calls show the call details only.

### Progressive dialing

A progressive dial group is a RingCX **Preview** dial group with **Enable progressive mode** checked. With one in the session, `rc-ringcx-agent-session-notify` has `permissions.progressiveEnabled: true`, and the Leads tab shows **Start dialing** instead of **Get leads**.

1. **Start dialing** (or `rc-adapter-ringcx-start-progressive-dial`) asks the agent to go available when needed, and connects the agent's line. The line stays connected while the dialer runs.
2. The widget fetches leads and dials them one by one. Before each dial it waits the dial group's **Progressive call delay**, at most 120 seconds. It moves to the next lead once the call and its disposition are done. When no leads come back, it fetches again every 5 seconds.
3. **Stop dialing** (or `rc-adapter-ringcx-stop-progressive-dial`) stops the dialer and disconnects the line once no call is live. A manual call, an inbound call, choosing a state other than Available, a dial group change, or logging out also stops it.

While the dialer runs, agents cannot pick the lead or its number, so the Lead tab's numbers are not clickable; **View lead** and **Manual pass** stay available. If RingCX leaves the agent in another state after a call, such as Working, the widget asks the agent to go available: **Go available** resumes dialing, and **Dismiss** stops it.

Follow the dialer with [`rc-ringcx-progressive-dial-notify`](#rc-ringcx-progressive-dial-notify).

## Voicemail drop

!!! warning "Experimental"
    Voicemail drop on RingCX calls is experimental.

With `enableVoicemailDrop=1` and `enableSideWidget=1`, agents using the integrated softphone can drop a pre-recorded message on outbound RingCX calls. Unlike RingEX calls, the agent stays on the call until the message ends, and can take over if a person answers. See [Voicemail drop on RingCX calls](../config/voicemail-drop.md#voicemail-drop-on-ringcx-calls-experimental).

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
| `rc-ev-setEnvironment` | The `appServer` parameter; RingCX follows the RingCentral environment |
| `rc-ev-register` | `rc-adapter-register-third-party-service` |
| `rc-ev-matchContacts` | `contactMatchPath` |
| `rc-ev-matchCallLogs` | `callLogEntityMatcherPath` |
| `rc-ev-logCall` | `callLoggerPath` |
| `rc-ev-viewLead` | `leadViewerPath` |
| `rc-ev-sideWidgetOpenNotify` | `rc-adapter-side-drawer-open-notify` |
| `rc-ev-setSideWidgetExtended` | Not carried over. The host controls the drawer. |
