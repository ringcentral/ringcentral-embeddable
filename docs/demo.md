---
hide:
  - navigation
  - toc
---

<div class="rc-builder">

<div class="rcb-hero">
  <p class="rcb-eyebrow">CTI Builder</p>
  <h1 class="rcb-title">Configure your Embeddable. Copy your code.</h1>
  <p class="rcb-sub">Adjust parameters below, preview the live widget, then paste your snippet into any web page. No account required to explore.</p>
</div>

<div class="rcb-layout">

<!-- ══════════════════════════════════════════════════════════
     SIDEBAR
     ══════════════════════════════════════════════════════════ -->
<div class="rcb-sidebar">

  <!-- 1 · App credentials (always open) -->
  <div class="rcb-section">
    <div class="rcb-section-header" onclick="rcbToggleSection(this)" style="cursor:default">
      <span class="rcb-section-title">App credentials</span>
      <button class="rcb-reset-btn" onclick="event.stopPropagation(); rcbReset()" title="Reset all settings and custom tabs to their defaults">Reset all</button>
    </div>
    <div class="rcb-section-body" id="sec-creds">
      <div class="rcb-field">
        <label class="rcb-field-label">
          Library version
          <i class="rcb-help" data-tip="Which release of the Embeddable library to load. Latest is recommended; 3.1.x is the beta with RingCX support; 2.x and 1.x are pinned branches for legacy deployments.">?</i>
        </label>
        <select class="rcb-select" id="rcb-version" onchange="rcbApplyVersion(); rcbScheduleUpdate()">
          <option value="latest" selected>Latest (recommended)</option>
          <option value="3.1.x">3.1.x (beta)</option>
          <option value="3.x">3.x</option>
          <option value="2.x">2.x</option>
          <option value="1.x">1.x (deprecated)</option>
        </select>
      </div>
      <div class="rcb-field">
        <label class="rcb-field-label">
          Client ID <span style="font-weight:400;color:#bbb">(optional)</span>
          <i class="rcb-help" data-tip="Removes the 'FOR DEMO PURPOSES ONLY' banner and scopes permissions to your registered app. Saved in this page's link, so it is included when you share the link.">?</i>
        </label>
        <input class="rcb-input" id="rcb-clientId" type="text" placeholder="your-client-id" oninput="rcbScheduleUpdate()">
      </div>
      <div class="rcb-field">
        <label class="rcb-field-label">
          Redirect URI <span style="font-weight:400;color:#bbb">(optional)</span>
          <i class="rcb-help" data-tip="Your OAuth redirect URI as registered in the RingCentral Developer Console. Only needed for custom auth flows.">?</i>
        </label>
        <input class="rcb-input" id="rcb-redirectUri" type="text" placeholder="https://your-site.com/redirect.html" oninput="rcbScheduleUpdate()">
      </div>
    </div>
  </div>

  <!-- 2 · Features -->
  <div class="rcb-section">
    <div class="rcb-section-header" onclick="rcbToggleSection(this)">
      <span class="rcb-section-title">Features</span>
      <svg class="rcb-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="rcb-section-body" id="sec-features">
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Calling
          <i class="rcb-help" data-tip="Controls all call-related features — dialing, receiving, hold, transfer, and in-call controls.">?</i>
        </span>
        <button class="rcb-toggle" data-off-param="disableCall" data-off-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          SMS &amp; messaging
          <i class="rcb-help" data-tip="Controls SMS and MMS messaging features.">?</i>
        </span>
        <button class="rcb-toggle" data-off-param="disableMessages" data-off-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Call history
          <i class="rcb-help" data-tip="Shows or hides the call history tab in the widget.">?</i>
        </span>
        <button class="rcb-toggle" data-off-param="disableCallHistory" data-off-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Contacts
          <i class="rcb-help" data-tip="Shows or hides the contacts directory.">?</i>
        </span>
        <button class="rcb-toggle" data-off-param="disableContacts" data-off-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Meetings
          <i class="rcb-help" data-tip="Shows or hides video meeting scheduling and joining.">?</i>
        </span>
        <button class="rcb-toggle" data-off-param="disableMeeting" data-off-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Chat
          <i class="rcb-help" data-tip="Adds the Chat tab for RingCentral team messaging. Off by default. Your app must include the 'Team Messaging' (or 'Glip') permission in the Developer Console.">?</i>
          <small>Requires Team Messaging scope</small>
        </span>
        <button class="rcb-toggle off" data-on-param="disableGlip" data-on-val="false" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Minimize button
          <i class="rcb-help" data-tip="Shows or hides the − button in the widget header.">?</i>
        </span>
        <button class="rcb-toggle" data-off-param="disableMinimize" data-off-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Sign-up button
          <i class="rcb-help" data-tip="Shows a link for new users to sign up for a RingCentral account.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="showSignUpButton" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
    </div>
  </div>

  <!-- 2b · RingCX (3.1.x only) -->
  <div class="rcb-section" data-only-in="3.1.x">
    <div class="rcb-section-header" onclick="rcbToggleSection(this)">
      <span class="rcb-section-title">RingCX <span class="rcb-badge-new">3.1.x</span></span>
      <svg class="rcb-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="rcb-section-body" id="sec-ringcx">
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          RingCX contact center
          <i class="rcb-help" data-tip="Adds the Agent tab so RingCX agents can handle contact center calls next to their RingEX calls. Only shown to users who have a RingCX account.">?</i>
          <small>Agent tab for RingCX users</small>
        </span>
        <button class="rcb-toggle off" data-on-param="enableRingCX" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row" data-requires="enableRingCX">
        <span class="rcb-toggle-label">
          Agent scripts
          <i class="rcb-help" data-tip="Shows RingCX agent scripts in the side panel during calls. Best used with Call widgets (side widget) on.">?</i>
          <small>Use with Call widgets (side widget)</small>
        </span>
        <button class="rcb-toggle off" data-on-param="enableAgentScript" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
    </div>
  </div>

  <!-- 3 · Calling mode -->
  <div class="rcb-section">
    <div class="rcb-section-header" onclick="rcbToggleSection(this)">
      <span class="rcb-section-title">Calling mode</span>
      <svg class="rcb-chevron rcb-ch-closed" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="rcb-section-body rcb-collapsed" id="sec-callmode">
      <label class="rcb-radio-card">
        <input type="radio" name="rcb-callwith" value="browser" checked onchange="rcbScheduleUpdate()">
        <div>
          <div class="rcb-radio-card-title">
            Browser (WebRTC)
            <i class="rcb-help" data-tip="Calls run directly in the browser via WebRTC — no desktop app required.">?</i>
          </div>
          <div class="rcb-radio-card-sub">Calls through the browser — no desktop app needed</div>
        </div>
      </label>
      <label class="rcb-radio-card">
        <input type="radio" name="rcb-callwith" value="jupiter" onchange="rcbScheduleUpdate()">
        <div>
          <div class="rcb-radio-card-title">
            RingCentral App
            <i class="rcb-help" data-tip="Routes calls to the RingCentral desktop application.">?</i>
          </div>
          <div class="rcb-radio-card-sub">Routes calls to the RC desktop app</div>
        </div>
      </label>
      <label class="rcb-radio-card">
        <input type="radio" name="rcb-callwith" value="ringout" onchange="rcbScheduleUpdate()">
        <div>
          <div class="rcb-radio-card-title">
            RingOut (two-leg)
            <i class="rcb-help" data-tip="Two-leg call: first dials your phone, then bridges to the destination number.">?</i>
          </div>
          <div class="rcb-radio-card-sub">Dials via an external phone number</div>
        </div>
      </label>
    </div>
  </div>

  <!-- 4 · Appearance -->
  <div class="rcb-section">
    <div class="rcb-section-header" onclick="rcbToggleSection(this)">
      <span class="rcb-section-title">Appearance</span>
      <svg class="rcb-chevron rcb-ch-closed" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="rcb-section-body rcb-collapsed" id="sec-appearance">
      <div class="rcb-field">
        <label class="rcb-field-label">
          Widget dock position
          <i class="rcb-help" data-tip="Sets which side of the page the widget badge anchors to when using the adapter.js embed method.">?</i>
        </label>
        <div class="rcb-dir-pair">
          <label class="rcb-dir-opt"><input type="radio" name="rcb-dir" value="right" checked onchange="rcbScheduleUpdate()"> Right</label>
          <label class="rcb-dir-opt"><input type="radio" name="rcb-dir" value="left" onchange="rcbScheduleUpdate()"> Left</label>
        </div>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          New dock-style badge UI
          <i class="rcb-help" data-tip="Enables the updated compact dock badge introduced in recent versions.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="newAdapterUI" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row" data-hide-in="3.1.x">
        <span class="rcb-toggle-label">
          Ringtone settings
          <i class="rcb-help" data-tip="Adds ringtone customization controls to the settings page so users can pick their own ringtone.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="enableRingtoneSettings" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-field" data-hide-in="3.1.x">
        <label class="rcb-field-label">
          Custom styles URI <span style="font-weight:400;color:#bbb">(optional)</span>
          <i class="rcb-help" data-tip="URL to a CSS stylesheet that will be injected into the widget for custom branding.">?</i>
        </label>
        <input class="rcb-input" id="rcb-stylesUri" type="text" placeholder="https://your-site.com/widget.css" oninput="rcbScheduleUpdate()">
      </div>
    </div>
  </div>

  <!-- 5 · Window & tabs -->
  <div class="rcb-section">
    <div class="rcb-section-header" onclick="rcbToggleSection(this)">
      <span class="rcb-section-title">Window &amp; tabs</span>
      <svg class="rcb-chevron rcb-ch-closed" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="rcb-section-body rcb-collapsed" id="sec-window">
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Enable popup window
          <i class="rcb-help" data-tip="Opens the widget in a standalone popup window instead of embedding it inline on the page.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="enablePopup" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-field" id="popupUriField" style="display:none">
        <label class="rcb-field-label">
          Popup page URI
          <i class="rcb-help" data-tip="The URL the popup window will open. Required when popup mode is enabled.">?</i>
        </label>
        <input class="rcb-input" id="rcb-popupPageUri" type="text" placeholder="https://your-site.com/popup.html" oninput="rcbScheduleUpdate()">
      </div>
      <div class="rcb-toggle-row" data-hide-in="3.1.x">
        <span class="rcb-toggle-label">
          Multiple tabs support
          <i class="rcb-help" data-tip="Keeps the widget functional when the same page is open in multiple browser tabs simultaneously.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="multipleTabsSupport" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row" data-hide-in="3.1.x">
        <span class="rcb-toggle-label">
          Disconnect inactive tab
          <i class="rcb-help" data-tip="Automatically disconnects the WebPhone in background tabs to prevent duplicate registrations.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="disconnectInactiveWebphone" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
    </div>
  </div>

  <!-- 6 · Advanced -->
  <div class="rcb-section">
    <div class="rcb-section-header" onclick="rcbToggleSection(this)">
      <span class="rcb-section-title">Advanced <span class="rcb-badge-dev">Dev</span></span>
      <svg class="rcb-chevron rcb-ch-closed" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 6l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="rcb-section-body rcb-collapsed" id="sec-advanced">
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Noise reduction settings
          <i class="rcb-help" data-tip="Adds noise reduction controls to the settings panel.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="enableNoiseReductionSetting" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          SMS templates
          <i class="rcb-help" data-tip="Enables pre-written SMS templates for faster messaging.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="enableSMSTemplate" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Shared queue SMS
          <i class="rcb-help" data-tip="Allows receiving SMS sent to call queue numbers. Requires v2.3.0+.">?</i>
          <small>Receive call queue messages (v2.3.0+)</small>
        </span>
        <button class="rcb-toggle off" data-on-param="enableSharedMessages" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Load calls beyond 7 days
          <i class="rcb-help" data-tip="Loads call history older than 7 days. Requires v2.1.0+.">?</i>
          <small>v2.1.0+</small>
        </span>
        <button class="rcb-toggle off" data-on-param="enableLoadMoreCalls" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Call widgets (side widget)
          <i class="rcb-help" data-tip="Shows a contextual side widget during active calls. Requires v3.0.0+.">?</i>
          <small>v3.0.0+</small>
        </span>
        <button class="rcb-toggle off" data-on-param="enableSideWidget" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row" data-requires="enableSideWidget">
        <span class="rcb-toggle-label">
          Voicemail drop
          <i class="rcb-help" data-tip="Lets users drop a pre-recorded message on outbound calls. Requires Call widgets (side widget) and v3.0.0+.">?</i>
          <small>v3.0.0+</small>
        </span>
        <button class="rcb-toggle off" data-on-param="enableVoicemailDrop" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Audio init prompt
          <i class="rcb-help" data-tip="Prompts the user to initialize audio — required by some browsers before playback can start.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="enableAudioInitPrompt" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-toggle-row">
        <span class="rcb-toggle-label">
          Analytics events
          <i class="rcb-help" data-tip="Fires custom events on user interactions that you can capture for analytics tracking.">?</i>
        </span>
        <button class="rcb-toggle off" data-on-param="enableAnalytics" data-on-val="1" onclick="rcbToggle(this)"></button>
      </div>
      <div class="rcb-field">
        <label class="rcb-field-label">
          Widget prefix
          <i class="rcb-help" data-tip="Namespaces the iframe ID and localStorage keys — useful when embedding multiple widgets on a single page.">?</i>
        </label>
        <input class="rcb-input" id="rcb-prefix" type="text" placeholder="rc-widget" oninput="rcbScheduleUpdate()">
      </div>
      <div class="rcb-field">
        <label class="rcb-field-label">
          Custom X-User-Agent
          <i class="rcb-help" data-tip="Appends a custom identifier to the X-User-Agent header for request attribution and support.">?</i>
        </label>
        <input class="rcb-input" id="rcb-userAgent" type="text" placeholder="MyApp/1.0" oninput="rcbScheduleUpdate()">
      </div>
    </div>
  </div>

</div><!-- /sidebar -->

<!-- ══════════════════════════════════════════════════════════
     PREVIEW PANE
     ══════════════════════════════════════════════════════════ -->
<div class="rcb-preview">

  <div class="rcb-link-notice" id="rcb-link-notice" role="alert" hidden>
    <div class="rcb-link-notice-title">This link changed your app settings</div>
    <p class="rcb-link-notice-text">Only keep them if you trust whoever shared the link. The preview loads once you choose.</p>
    <dl class="rcb-link-notice-list" id="rcb-link-notice-list"></dl>
    <div class="rcb-link-notice-actions">
      <button class="rcb-link-notice-keep" onclick="rcbKeepLinkConfig()">Keep</button>
      <button class="rcb-link-notice-discard" onclick="rcbDiscardLinkConfig()">Discard</button>
    </div>
  </div>

  <div class="rcb-refresh-note" id="rcb-refresh-note">
    Preview updating…
  </div>

  <div class="rcb-preview-row">

    <div class="rcb-widget-wrap">
      <iframe
        id="rcb-frame"
        width="300"
        height="500"
        allow="microphone; autoplay">
      </iframe>
    </div>

    <div class="rcb-code-box">
      <div class="rcb-code-tabs-bar">
        <button class="rcb-code-tab-btn active" id="rcb-tab-adapter" onclick="rcbSetTab('adapter')">adapter.js</button>
        <button class="rcb-code-tab-btn" id="rcb-tab-iframe" onclick="rcbSetTab('iframe')">iframe</button>
        <button class="rcb-copy-btn" onclick="rcbCopy()">Copy</button>
      </div>
      <div class="rcb-code-body">
        <pre class="rcb-code-pre" id="rcb-code-out"></pre>
      </div>
    </div>

  </div><!-- /preview-row -->

  <!-- ═══════════════════════════════════════════════════════
       TAB BUILDER
       ═══════════════════════════════════════════════════════ -->
  <div class="rcb-tab-builder" id="rcb-tab-builder">
    <div class="rcb-tb-top">
      <div class="rcb-tb-section-hd">
        <span class="rcb-tb-section-title">Tab Builder</span>
        <span class="rcb-tb-section-sub">Add custom tabs to the widget — preview updates live above.</span>
      </div>
      <button class="rcb-tb-add-tab-btn" onclick="rcbTbAddTab()">+ Add tab</button>
    </div>
    <div id="rcb-tb-body"></div>
  </div>

</div><!-- /preview -->

</div><!-- /layout -->
</div><!-- /rc-builder -->

<!-- Tooltip singleton -->
<div class="rcb-tip" id="rcb-tip"></div>

<script>
(function() {

var _tab = 'adapter';
var _debounce = null;

// ── Tooltip ───────────────────────────────────────────────────
var _tip = document.getElementById('rcb-tip');
document.querySelectorAll('.rcb-help').forEach(function(el) {
  el.addEventListener('mouseenter', function() {
    var text = el.getAttribute('data-tip');
    if (!text || !_tip) return;
    _tip.textContent = text;
    var rect = el.getBoundingClientRect();
    _tip.style.display = 'block';
    var tipW = _tip.offsetWidth;
    var tipH = _tip.offsetHeight;
    var left = rect.right + 10;
    var top  = rect.top + rect.height / 2 - tipH / 2;
    // Flip left if it would overflow viewport right
    if (left + tipW > window.innerWidth - 8) {
      left = rect.left - tipW - 10;
      _tip.style.setProperty('--arrow-side', 'left');
      _tip.classList.add('rcb-tip-left');
    } else {
      _tip.classList.remove('rcb-tip-left');
    }
    top = Math.max(8, Math.min(top, window.innerHeight - tipH - 8));
    _tip.style.left = left + 'px';
    _tip.style.top  = top + 'px';
  });
  el.addEventListener('mouseleave', function() {
    if (_tip) _tip.style.display = 'none';
  });
});

// ── Accordion ────────────────────────────────────────────────
window.rcbToggleSection = function(header) {
  var body = header.nextElementSibling;
  var ch   = header.querySelector('.rcb-chevron');
  if (!body || !body.classList.contains('rcb-section-body')) return;
  var closed = body.classList.toggle('rcb-collapsed');
  if (ch) ch.style.transform = closed ? 'rotate(-90deg)' : 'rotate(0deg)';
};

// ── Toggle switches ──────────────────────────────────────────
// Show/hide popupPageUri field
function syncPopupField() {
  var enablePopupBtn = document.querySelector('[data-on-param="enablePopup"]');
  var field = document.getElementById('popupUriField');
  if (enablePopupBtn && field) field.style.display = enablePopupBtn.classList.contains('off') ? 'none' : 'block';
}

window.rcbToggle = function(btn) {
  btn.classList.toggle('off');
  syncPopupField();
  rcbApplyVersion();
  rcbScheduleUpdate();
};

// ── Base URL (version-aware) ─────────────────────────────────
function getVersion() {
  return (document.getElementById('rcb-version') || {}).value || 'latest';
}

function getBase() {
  return 'https://apps.ringcentral.com/integration/ringcentral-embeddable/' + getVersion() + '/';
}

// ── Version- and dependency-gated fields ─────────────────────
// data-only-in / data-hide-in: shown only in / hidden in the listed version.
// data-requires: shown only when the toggle with that data-on-param is on.
function isToggleOn(param) {
  var btn = document.querySelector('[data-on-param="' + param + '"]');
  return !!btn && !btn.classList.contains('off') && !isGated(btn);
}

function isGated(el) {
  var ver = getVersion();
  var node = el;
  while (node && node.getAttribute) {
    var onlyIn   = node.getAttribute('data-only-in');
    var hideIn   = node.getAttribute('data-hide-in');
    var requires = node.getAttribute('data-requires');
    if (onlyIn && onlyIn !== ver) return true;
    if (hideIn && hideIn === ver) return true;
    if (requires && !isToggleOn(requires)) return true;
    node = node.parentNode;
  }
  return false;
}

window.rcbApplyVersion = function() {
  document.querySelectorAll('[data-only-in],[data-hide-in],[data-requires]').forEach(function(el) {
    el.style.display = isGated(el) ? 'none' : '';
  });
};

// ── Preview ──────────────────────────────────────────────────
// Where the Embeddable app is served from, for messages to it
var APP_ORIGIN = 'https://apps.ringcentral.com';
// The iframe tab previews app.html directly. The adapter.js tab previews a
// host page that runs the adapter.js snippet, so the frame shows the
// floating widget with its header, badge and popup button.
var APP_WIDTH = 300;
// adapter.js keeps the widget this far from the page edges, under a header
// this tall.
var ADAPTER_PADDING = 15;
var ADAPTER_HEADER_HEIGHT = 36;
// Room above the widget on the host page so it can be dragged; the page
// also fills the width the code box leaves.
var HOST_EXTRA_HEIGHT = 60;
// The app width with the side panel open
var EXPANDED_APP_WIDTH = 600;

// The mode the preview was last loaded in: 'adapter' or 'iframe'
var _previewMode = null;

function getDefaultAppHeight() {
  return getVersion() === '3.1.x' ? 540 : 500;
}

function getPrefix() {
  var prefix = ((document.getElementById('rcb-prefix') || {}).value || '').trim();
  return prefix || 'rc-widget';
}

// Whether the app can widen to show a side panel: 3.1.x opens detail pages
// in it, older versions only with the side widget on.
function canExpand() {
  return getVersion() === '3.1.x' || isToggleOn('enableSideWidget');
}

// Sizes the preview frame to fit the app. A host page for adapter.js fills
// the width beside the code box and leaves room to drag the widget. Like a
// real page, it is already wide enough for the expanded widget, so it does
// not grow when the side panel opens.
function setFrameSize(appWidth, appHeight) {
  var frame = document.getElementById('rcb-frame');
  if (!frame) return;
  var height = appHeight;
  if (_previewMode === 'adapter') {
    var pageWidth = Math.max(appWidth, canExpand() ? EXPANDED_APP_WIDTH : APP_WIDTH);
    height += ADAPTER_HEADER_HEIGHT + 2 * ADAPTER_PADDING + HOST_EXTRA_HEIGHT;
    frame.style.width    = '100%';
    frame.style.minWidth = (pageWidth + 2 * ADAPTER_PADDING) + 'px';
  } else {
    frame.style.width    = appWidth + 'px';
    frame.style.minWidth = '';
  }
  frame.style.height = height + 'px';
  var row = frame.closest('.rcb-preview-row');
  if (row) row.style.setProperty('--rcb-frame-h', height + 'px');
}

// The window of the Embeddable app inside the preview frame
function getAppWindow() {
  var frame = document.getElementById('rcb-frame');
  if (!frame || !frame.contentWindow) return null;
  if (_previewMode !== 'adapter') return frame.contentWindow;
  try {
    var appFrame = frame.contentDocument.getElementById(getPrefix() + '-adapter-frame');
    return appFrame ? appFrame.contentWindow : null;
  } catch (e) {
    return null;
  }
}

// The app posts its size when it loads and when the side widget opens or
// closes, and adapter.js resizes its frame to match.
function onAppMessage(e) {
  var data = e.data;
  if (!data || !e.source || e.source !== getAppWindow()) return;
  if (data.type === 'rc-adapter-syncSize' || data.type === 'rc-adapter-pushAdapterState') {
    var size = data.size;
    if (size && size.width > 0 && size.height > 0) setFrameSize(size.width, size.height);
    // adapter.js widens the widget from where it was dragged to, which can
    // push it past the page's left edge. A resize makes it fit the widget
    // back into the page.
    if (_previewMode === 'adapter') e.currentTarget.dispatchEvent(new Event('resize'));
  } else if (data.type === 'rc-login-status-notify') {
    // A reloaded app has lost the custom tabs, so register them again.
    tbRegister();
  }
}

// In iframe mode the app posts to this page; with adapter.js it posts to the
// host page in the frame.
window.addEventListener('message', onAppMessage);

function buildHostPage() {
  return '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;height:100%;overflow:hidden;background:#f6f7f9;}' +
    'p{margin:0;padding:16px 20px;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#999;user-select:none;}</style>' +
    '</head><body><p>This area stands in for your website. Drag the widget by its header to move it.</p>' +
    buildAdapterSnippet() + '</body></html>';
}

function buildPausedPage() {
  return '<!doctype html><html><head><meta charset="utf-8">' +
    '<style>html,body{margin:0;height:100%;background:#f6f7f9;}' +
    'p{margin:0;padding:24px 20px;text-align:center;font:12px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#999;}</style>' +
    '</head><body><p>Preview paused. Keep or discard the settings from the link to load it.</p></body></html>';
}

function reloadPreview() {
  var frame = document.getElementById('rcb-frame');
  if (!frame) return;
  _previewMode = _tab;
  if (_linkNoticeOpen) {
    // Signing in to an app from an untrusted link is the risk, so nothing
    // loads until the user decides.
    _previewMode = 'paused';
    var pausedRow = frame.closest('.rcb-preview-row');
    if (pausedRow) pausedRow.classList.remove('rcb-preview-row-host');
    setFrameSize(APP_WIDTH, getDefaultAppHeight());
    frame.classList.remove('rcb-frame-host');
    frame.removeAttribute('src');
    frame.srcdoc = buildPausedPage();
    return;
  }
  var row = frame.closest('.rcb-preview-row');
  if (row) row.classList.toggle('rcb-preview-row-host', _previewMode === 'adapter');
  // The reloaded app starts folded and posts its size once it loads.
  setFrameSize(APP_WIDTH, getDefaultAppHeight());
  frame.classList.toggle('rcb-frame-host', _previewMode === 'adapter');
  if (_previewMode === 'adapter') {
    frame.removeAttribute('src');
    frame.srcdoc = buildHostPage();
  } else {
    frame.removeAttribute('srcdoc');
    frame.src = buildAppSrc();
  }
}

document.getElementById('rcb-frame').addEventListener('load', function() {
  if (_previewMode !== 'adapter') return;
  try {
    this.contentWindow.addEventListener('message', onAppMessage);
  } catch (e) {}
});

// ── Build query params ───────────────────────────────────────
function buildParams() {
  var p = [];

  function add(k, v) { if (v !== '' && v !== null && v !== undefined) p.push(k + '=' + encodeURIComponent(v)); }

  var clientId    = (document.getElementById('rcb-clientId') || {}).value || '';
  var redirectUri = (document.getElementById('rcb-redirectUri') || {}).value || '';
  var stylesEl    = document.getElementById('rcb-stylesUri');
  var stylesUri   = (stylesEl && !isGated(stylesEl)) ? stylesEl.value : '';
  var prefix      = (document.getElementById('rcb-prefix') || {}).value || '';
  var userAgent   = (document.getElementById('rcb-userAgent') || {}).value || '';
  var popupUri    = (document.getElementById('rcb-popupPageUri') || {}).value || '';

  add('clientId', clientId.trim());
  add('redirectUri', redirectUri.trim());
  add('stylesUri', stylesUri.trim());
  if (prefix.trim() && prefix.trim() !== 'rc-widget') add('prefix', prefix.trim());
  add('userAgent', userAgent.trim());
  add('popupPageUri', popupUri.trim());

  var cw = document.querySelector('input[name="rcb-callwith"]:checked');
  if (cw && cw.value !== 'browser') add('defaultCallWith', cw.value);

  var dir = document.querySelector('input[name="rcb-dir"]:checked');
  if (dir && dir.value !== 'right') add('defaultDirection', dir.value);

  // Toggles
  document.querySelectorAll('.rcb-toggle').forEach(function(t) {
    if (isGated(t)) return;
    var isOff = t.classList.contains('off');
    var onParam  = t.getAttribute('data-on-param');
    var onVal    = t.getAttribute('data-on-val');
    var offParam = t.getAttribute('data-off-param');
    var offVal   = t.getAttribute('data-off-val');
    if (!isOff && onParam)  add(onParam,  onVal  || '1');
    if (isOff  && offParam) add(offParam, offVal || '1');
  });

  return p;
}

// ── Render code snippet ──────────────────────────────────────
function getQuery() {
  var params = buildParams();
  return params.length ? '?' + params.join('&') : '';
}

function buildAppSrc() {
  return getBase() + 'app.html' + getQuery();
}

function buildAdapterSnippet() {
  var src = getBase() + 'adapter.js' + getQuery();
  return '<script>\n(function() {\n  var rcs = document.createElement("script");\n  rcs.src = "' + src + '";\n  var rcs0 = document.getElementsByTagName("script")[0];\n  rcs0.parentNode.insertBefore(rcs, rcs0);\n})();\n<\/script>';
}

function renderCode() {
  var out;

  if (_tab === 'adapter') {
    out = buildAdapterSnippet();
    if (typeof _tb !== 'undefined' && _tb.tabs && _tb.tabs.length) {
      var tabLines = _tb.tabs.map(function(tab) {
        var page = tbBuildPage(tab);
        var json = JSON.stringify(page, null, 2).replace(/\n/g, '\n    ');
        return '  document.querySelector("#rc-widget-adapter-frame")\n' +
               '    .contentWindow.postMessage({\n' +
               '    type: "rc-adapter-register-customized-page",\n' +
               '    page: ' + json + '\n' +
               '  }, "*");';
      });
      out += '\n\n<script>\n// Register custom tabs\n' + tabLines.join('\n\n') + '\n<\/script>';
    }
  } else {
    out = '<iframe width="' + APP_WIDTH + '" height="' + getDefaultAppHeight() + '"\n  allow="microphone"\n  src="' + buildAppSrc() + '">\n</iframe>';
  }

  var el = document.getElementById('rcb-code-out');
  if (el) el.textContent = out;
}

// ── Update iframe (debounced) ────────────────────────────────
window.rcbScheduleUpdate = function() {
  renderCode();
  saveConfig();
  var note = document.getElementById('rcb-refresh-note');
  if (note) note.classList.add('visible');
  clearTimeout(_debounce);
  _debounce = setTimeout(function() {
    reloadPreview();
    if (note) note.classList.remove('visible');
  }, 1000);
};

// ── Tab switching ─────────────────────────────────────────────
function renderCodeTabs() {
  ['adapter','iframe'].forEach(function(t) {
    var btn = document.getElementById('rcb-tab-' + t);
    if (btn) btn.className = 'rcb-code-tab-btn' + (t === _tab ? ' active' : '');
  });
}

window.rcbSetTab = function(tab) {
  _tab = tab;
  renderCodeTabs();
  renderCode();
  saveConfig();
  if (_previewMode !== tab) {
    clearTimeout(_debounce);
    var note = document.getElementById('rcb-refresh-note');
    if (note) note.classList.remove('visible');
    reloadPreview();
  }
};

// ── Copy ──────────────────────────────────────────────────────
window.rcbCopy = function() {
  var text = (document.getElementById('rcb-code-out') || {}).textContent || '';
  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.querySelector('.rcb-copy-btn');
    if (!btn) return;
    btn.textContent = 'Copied!';
    setTimeout(function() { btn.textContent = 'Copy'; }, 2000);
  });
};

// ── Saved settings ───────────────────────────────────────────
// Settings are kept in the URL hash, so a reload keeps them and the link can
// be shared, and in localStorage, so opening the page without a hash brings
// back the last ones. Keys and values match the snippet's parameters, and
// only changes from the defaults are saved. Custom tabs are too big for a
// link, so they are only kept in localStorage.
var STORAGE_KEY_CONFIG = 'rcb-config';
var STORAGE_KEY_TABS   = 'rcb-tabs';
var TEXT_FIELDS = ['clientId', 'redirectUri', 'stylesUri', 'popupPageUri', 'prefix', 'userAgent'];
var RADIO_FIELDS = [
  { name: 'rcb-callwith', key: 'defaultCallWith' },
  { name: 'rcb-dir',      key: 'defaultDirection' },
];
// The settings last written to the hash
var _savedConfig = null;

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function storageSet(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch (e) {}
}

// A hash holds settings when it has key=value pairs, not a heading anchor
function getHashConfig() {
  var hash = location.hash.replace(/^#/, '');
  return hash.indexOf('=') >= 0 ? hash : '';
}

function serializeConfig() {
  var p = new URLSearchParams();
  if (getVersion() !== 'latest') p.set('version', getVersion());
  if (_tab !== 'adapter') p.set('code', _tab);
  TEXT_FIELDS.forEach(function(key) {
    var el = document.getElementById('rcb-' + key);
    if (el && el.value.trim()) p.set(key, el.value);
  });
  RADIO_FIELDS.forEach(function(field) {
    var checked = document.querySelector('input[name="' + field.name + '"]:checked');
    if (checked && !checked.defaultChecked) p.set(field.key, checked.value);
  });
  // On-param toggles are off by default and off-param toggles on, so a
  // saved param always means a change from the default.
  document.querySelectorAll('.rcb-toggle').forEach(function(t) {
    var isOff    = t.classList.contains('off');
    var onParam  = t.getAttribute('data-on-param');
    var offParam = t.getAttribute('data-off-param');
    if (onParam && !isOff) p.set(onParam,  t.getAttribute('data-on-val')  || '1');
    if (offParam && isOff) p.set(offParam, t.getAttribute('data-off-val') || '1');
  });
  return p.toString();
}

function applyConfig(query) {
  var p = new URLSearchParams(query);
  var version = document.getElementById('rcb-version');
  if (version) {
    var wanted = p.get('version');
    var known = wanted && version.querySelector('option[value="' + CSS.escape(wanted) + '"]');
    version.value = known ? wanted : 'latest';
  }
  _tab = p.get('code') === 'iframe' ? 'iframe' : 'adapter';
  renderCodeTabs();
  TEXT_FIELDS.forEach(function(key) {
    var el = document.getElementById('rcb-' + key);
    if (el) el.value = p.get(key) || '';
  });
  RADIO_FIELDS.forEach(function(field) {
    var radios = Array.prototype.slice.call(document.querySelectorAll('input[name="' + field.name + '"]'));
    var wanted = p.get(field.key);
    var match = radios.some(function(r) { return r.value === wanted; });
    radios.forEach(function(r) { r.checked = match ? r.value === wanted : r.defaultChecked; });
  });
  document.querySelectorAll('.rcb-toggle').forEach(function(t) {
    var onParam  = t.getAttribute('data-on-param');
    var offParam = t.getAttribute('data-off-param');
    if (onParam)  t.classList.toggle('off', !p.has(onParam));
    if (offParam) t.classList.toggle('off', p.has(offParam));
  });
  syncPopupField();
  rcbApplyVersion();
}

function writeHash(query) {
  _savedConfig = query;
  history.replaceState(history.state, '', location.pathname + location.search + (query ? '#' + query : ''));
}

function saveConfig() {
  var query = serializeConfig();
  writeHash(query);
  // Settings from a link are only remembered once the user keeps them, or,
  // when the link changed no app credentials or URLs, changes something.
  if (_linkNoticeOpen) return;
  storageSet(STORAGE_KEY_CONFIG, query);
}

// ── Settings from a link ──────────────────────────────────────
// A link can point the widget at someone else's app or pages, so the
// settings that do that need the user's OK before they load or are saved.
var LINK_CHECKED_FIELDS = [
  { key: 'clientId',     label: 'Client ID' },
  { key: 'redirectUri',  label: 'Redirect URI' },
  { key: 'stylesUri',    label: 'Custom styles URI' },
  { key: 'popupPageUri', label: 'Popup page URI' },
];
var _linkNoticeOpen = false;

// The checked fields the link sets to something other than the saved
// settings, so reloading your own link shows no notice
function getLinkChanges(query) {
  var link  = new URLSearchParams(query);
  var saved = new URLSearchParams(storageGet(STORAGE_KEY_CONFIG) || '');
  return LINK_CHECKED_FIELDS.filter(function(field) {
    var value = link.get(field.key);
    return value && value !== saved.get(field.key);
  }).map(function(field) {
    return { label: field.label, value: link.get(field.key) };
  });
}

function showLinkNotice(changes) {
  var list = document.getElementById('rcb-link-notice-list');
  if (list) {
    list.textContent = '';
    changes.forEach(function(change) {
      var dt = document.createElement('dt');
      dt.textContent = change.label;
      var dd = document.createElement('dd');
      dd.textContent = change.value;
      list.appendChild(dt);
      list.appendChild(dd);
    });
  }
  _linkNoticeOpen = true;
  var notice = document.getElementById('rcb-link-notice');
  if (notice) notice.hidden = false;
}

function hideLinkNotice() {
  _linkNoticeOpen = false;
  var notice = document.getElementById('rcb-link-notice');
  if (notice) notice.hidden = true;
}

// Applies settings from a link without saving them
function openLinkConfig(query) {
  applyConfig(query);
  var changes = getLinkChanges(query);
  if (changes.length) showLinkNotice(changes);
  else hideLinkNotice();
  renderCode();
  writeHash(serializeConfig());
}

window.rcbKeepLinkConfig = function() {
  hideLinkNotice();
  saveConfig();
  reloadPreview();
};

window.rcbDiscardLinkConfig = function() {
  hideLinkNotice();
  applyConfig(storageGet(STORAGE_KEY_CONFIG) || '');
  renderCode();
  saveConfig();
  reloadPreview();
};

// A config link opened in this page, such as one pasted into the address bar
window.addEventListener('hashchange', function() {
  var query = getHashConfig();
  if (!query || query === _savedConfig) return;
  openLinkConfig(query);
  clearTimeout(_debounce);
  reloadPreview();
});

window.rcbReset = function() {
  var hasTabs = typeof _tb !== 'undefined' && _tb.tabs.length > 0;
  var message = hasTabs
    ? 'Reset all settings to their defaults and remove your custom tabs?'
    : 'Reset all settings to their defaults?';
  if (!confirm(message)) return;
  storageSet(STORAGE_KEY_CONFIG, '');
  storageSet(STORAGE_KEY_TABS, '');
  history.replaceState(history.state, '', location.pathname + location.search);
  location.reload();
};

// ── Init ──────────────────────────────────────────────────────
document.querySelectorAll('.rcb-ch-closed').forEach(function(ch) {
  ch.style.transform = 'rotate(-90deg)';
});

var linkConfig = getHashConfig();
var storedConfig = storageGet(STORAGE_KEY_CONFIG);
if (linkConfig) {
  openLinkConfig(linkConfig);
} else if (storedConfig) {
  applyConfig(storedConfig);
  renderCode();
  writeHash(serializeConfig());
} else {
  rcbApplyVersion();
  renderCode();
}
reloadPreview();

// ═══════════════════════════════════════════════════════════════
//  TAB BUILDER
// ═══════════════════════════════════════════════════════════════

var _tb = { tabs: [], sel: null, expEl: null };

// Default placeholder icons (4-square grid, 24×24)
// normal = #16181D, active = #2559E4  (RC recommended colours)
var _tbIconSvg = function(colour) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">' +
    '<rect x="3"  y="3"  width="8" height="8" rx="1.5" fill="' + colour + '"/>' +
    '<rect x="13" y="3"  width="8" height="8" rx="1.5" fill="' + colour + '"/>' +
    '<rect x="3"  y="13" width="8" height="8" rx="1.5" fill="' + colour + '"/>' +
    '<rect x="13" y="13" width="8" height="8" rx="1.5" fill="' + colour + '"/>' +
  '</svg>';
};
var TB_ICON        = 'data:image/svg+xml,' + encodeURIComponent(_tbIconSvg('#16181D'));
var TB_ICON_ACTIVE = 'data:image/svg+xml,' + encodeURIComponent(_tbIconSvg('#2559E4'));

var _tbTypes = [
  { type: 'text',     icon: 'Aa', label: 'Text input' },
  { type: 'textarea', icon: '¶',  label: 'Textarea'   },
  { type: 'dropdown', icon: '↕',  label: 'Dropdown'   },
  { type: 'button',   icon: '◻',  label: 'Button'     },
  { type: 'message',  icon: 'T',  label: 'Message'    },
  { type: 'alert',    icon: '!',  label: 'Alert'      },
];

function tbUid()  { return 'x' + Math.random().toString(36).slice(2,7); }

function tbDefaultEl(type) {
  var k = tbUid();
  switch(type) {
    case 'text':     return { key:k, type:type, label:'Text field', placeholder:'' };
    case 'textarea': return { key:k, type:type, label:'Note', placeholder:'Enter a note…' };
    case 'dropdown': return { key:k, type:type, label:'Select an option', options:[{val:'opt1',label:'Option 1'},{val:'opt2',label:'Option 2'}] };
    case 'button':   return { key:k, type:type, label:'Click me', variant:'contained' };
    case 'message':  return { key:k, type:type, text:'This is a message.', variant:'body1' };
    case 'alert':    return { key:k, type:type, text:'This is an alert.', severity:'warning' };
  }
}

function tbEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Data mutations ───────────────────────────────────────────
window.rcbTbAddTab = function() {
  var id = tbUid();
  _tb.tabs.push({ id:id, title:'My Tab', iconUri:'', priority:31, elements:[] });
  _tb.sel = id; _tb.expEl = null;
  tbRender(); tbPush();
};

window.rcbTbDeleteTab = function(id) {
  _tb.tabs = _tb.tabs.filter(function(t){ return t.id !== id; });
  if (_tb.sel === id) _tb.sel = _tb.tabs.length ? _tb.tabs[0].id : null;
  tbRender(); tbPush();
};

window.rcbTbSelectTab = function(id) {
  _tb.sel = id; _tb.expEl = null; tbRender();
};

window.rcbTbAddEl = function(type) {
  var tab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  if (!tab) return;
  var el = tbDefaultEl(type);
  tab.elements.push(el); _tb.expEl = el.key;
  tbRender(); tbPush();
};

window.rcbTbDeleteEl = function(key) {
  var tab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  if (!tab) return;
  tab.elements = tab.elements.filter(function(e){ return e.key !== key; });
  if (_tb.expEl === key) _tb.expEl = null;
  tbRender(); tbPush();
};

window.rcbTbMoveEl = function(key, dir) {
  var tab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  if (!tab) return;
  var i = tab.elements.findIndex(function(e){ return e.key === key; });
  var j = dir === 'up' ? i-1 : i+1;
  if (i < 0 || j < 0 || j >= tab.elements.length) return;
  var tmp = tab.elements[i]; tab.elements[i] = tab.elements[j]; tab.elements[j] = tmp;
  tbRender(); tbPush(true); // forceRefresh: navigate away+back so widget re-renders reordered schema
};

window.rcbTbToggleEl = function(key) {
  _tb.expEl = _tb.expEl === key ? null : key; tbRender();
};

// Non-structural updates — update data only, no full re-render
window.rcbTbSetTabField = function(id, field, val) {
  var tab = _tb.tabs.find(function(t){ return t.id === id; });
  if (!tab) return;
  tab[field] = val;
  if (field === 'title') {
    var span = document.querySelector('.rcb-tb-pill-active > span');
    if (span) span.textContent = val || 'My Tab';
  }
  tbPush(); renderCode();
};

window.rcbTbSetElField = function(key, field, val) {
  var tab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  var el = tab && tab.elements.find(function(e){ return e.key === key; });
  if (el) { el[field] = val; tbPush(); renderCode(); }
};

window.rcbTbAddOpt = function(key) {
  var tab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  var el = tab && tab.elements.find(function(e){ return e.key === key; });
  if (!el) return;
  el.options.push({ val:'opt'+(el.options.length+1), label:'Option '+(el.options.length+1) });
  tbRender(); tbPush();
};

window.rcbTbDelOpt = function(key, idx) {
  var tab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  var el = tab && tab.elements.find(function(e){ return e.key === key; });
  if (!el) return;
  el.options.splice(idx, 1); tbRender(); tbPush();
};

window.rcbTbSetOpt = function(key, idx, field, val) {
  var tab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  var el = tab && tab.elements.find(function(e){ return e.key === key; });
  if (el && el.options[idx]) { el.options[idx][field] = val; tbPush(); renderCode(); }
};

// ── Build JSON schema + uiSchema for a tab ───────────────────
function tbBuildPage(tab) {
  var schema = { type:'object', required:[], properties:{} };
  var uiSchema = { submitButtonOptions:{ submitText:'Save' } };
  var formData = {};

  tab.elements.forEach(function(el) {
    var k = el.key;
    switch(el.type) {
      case 'text':
        schema.properties[k] = { type:'string', title:el.label||'Text' };
        if (el.placeholder) uiSchema[k] = { 'ui:placeholder':el.placeholder };
        formData[k] = '';
        break;
      case 'textarea':
        schema.properties[k] = { type:'string', title:el.label||'Note' };
        uiSchema[k] = { 'ui:widget':'textarea' };
        if (el.placeholder) uiSchema[k]['ui:placeholder'] = el.placeholder;
        formData[k] = '';
        break;
      case 'dropdown':
        schema.properties[k] = {
          type:'string', title:el.label||'Select',
          oneOf:(el.options||[]).map(function(o){ return { const:o.val, title:o.label }; })
        };
        formData[k] = (el.options&&el.options[0]) ? el.options[0].val : '';
        break;
      case 'button':
        schema.properties[k] = { type:'string', title:el.label||'Button' };
        uiSchema[k] = { 'ui:field':'button', 'ui:variant':el.variant||'contained', 'ui:fullWidth':true };
        break;
      case 'message':
        schema.properties[k] = { type:'string', description:el.text||'' };
        uiSchema[k] = { 'ui:field':'typography', 'ui:variant':el.variant||'body1' };
        break;
      case 'alert':
        schema.properties[k] = { type:'string', description:el.text||'' };
        uiSchema[k] = { 'ui:field':'admonition', 'ui:severity':el.severity||'warning' };
        break;
    }
  });

  var customIcon = tab.iconUri && tab.iconUri.trim();
  var page = {
    id: tab.id,
    title: tab.title || 'My Tab',
    type: 'tab',
    iconUri:       customIcon || TB_ICON,
    activeIconUri: customIcon || TB_ICON_ACTIVE,
    priority: parseInt(tab.priority)||31,
    schema: schema,
    uiSchema: uiSchema,
    formData: formData,
  };
  return page;
}

// ── Push to live widget ───────────────────────────────────────
// forceRefresh: navigate away then back so the widget re-renders
// the tab content even when the path hasn't changed (needed after reorder)
function tbRegister() {
  var appWindow = getAppWindow();
  if (!appWindow) return;
  _tb.tabs.forEach(function(tab) {
    appWindow.postMessage({
      type: 'rc-adapter-register-customized-page',
      page: tbBuildPage(tab)
    }, APP_ORIGIN);
  });
}

function tbSave() {
  storageSet(STORAGE_KEY_TABS, _tb.tabs.length ? JSON.stringify({ tabs: _tb.tabs, sel: _tb.sel }) : '');
}

// Saved tabs are rendered into HTML, so only well-formed values are restored
var TB_ID_PATTERN = /^[a-z0-9]{1,16}$/;
var TB_CHOICES = {
  button:  { field: 'variant',  values: ['contained', 'outlined', 'text', 'plain'] },
  message: { field: 'variant',  values: ['title1', 'title2', 'subheading1', 'body1', 'body2', 'caption1'] },
  alert:   { field: 'severity', values: ['info', 'warning', 'error', 'success'] },
};

function tbString(value) {
  return typeof value === 'string' ? value : '';
}

function tbCleanEl(el) {
  if (!el || !TB_ID_PATTERN.test(el.key)) return null;
  var known = _tbTypes.some(function(t) { return t.type === el.type; });
  if (!known) return null;
  var clean = tbDefaultEl(el.type);
  clean.key = el.key;
  ['label', 'placeholder', 'text'].forEach(function(field) {
    if (field in clean) clean[field] = tbString(el[field]);
  });
  var choice = TB_CHOICES[el.type];
  if (choice && choice.values.indexOf(el[choice.field]) >= 0) clean[choice.field] = el[choice.field];
  if (el.type === 'dropdown') {
    clean.options = (Array.isArray(el.options) ? el.options : []).filter(Boolean).map(function(opt) {
      return { val: tbString(opt.val), label: tbString(opt.label) };
    });
  }
  return clean;
}

function tbCleanTab(tab) {
  if (!tab || !TB_ID_PATTERN.test(tab.id)) return null;
  var priority = parseInt(tab.priority, 10);
  return {
    id: tab.id,
    title: tbString(tab.title),
    iconUri: tbString(tab.iconUri),
    priority: isFinite(priority) ? priority : 31,
    elements: (Array.isArray(tab.elements) ? tab.elements : []).map(tbCleanEl).filter(Boolean),
  };
}

function tbRestore() {
  var saved;
  try { saved = JSON.parse(storageGet(STORAGE_KEY_TABS) || 'null'); } catch (e) { return; }
  if (!saved || !Array.isArray(saved.tabs)) return;
  var tabs = saved.tabs.map(tbCleanTab).filter(Boolean);
  if (!tabs.length) return;
  _tb.tabs = tabs;
  var hasSel = tabs.some(function(t) { return t.id === saved.sel; });
  _tb.sel = hasSel ? saved.sel : tabs[0].id;
}

function tbPush(forceRefresh) {
  tbSave();
  var appWindow = getAppWindow();
  if (!appWindow) return;
  tbRegister();
  if (!_tb.sel) return;
  var selId = _tb.sel;
  if (forceRefresh) {
    appWindow.postMessage({ type: 'rc-adapter-navigate-to', path: '/' }, APP_ORIGIN);
    setTimeout(function() {
      var w = getAppWindow();
      if (w) w.postMessage({ type: 'rc-adapter-navigate-to', path: '/customizedTabs/' + selId }, APP_ORIGIN);
    }, 80);
  } else {
    appWindow.postMessage({ type: 'rc-adapter-navigate-to', path: '/customizedTabs/' + selId }, APP_ORIGIN);
  }
}

// ── Render code snippet ───────────────────────────────────────

// ── Element editor HTML ───────────────────────────────────────
function tbElEditor(el) {
  var k = el.key;
  var h = '';
  function field(label, attrs) {
    return '<div class="rcb-field"><label class="rcb-field-label">' + label + '</label>' +
           '<input class="rcb-input" ' + attrs + '></div>';
  }
  function sel(label, field, cur, opts) {
    var options = opts.map(function(o){
      return '<option value="'+o[0]+'"'+(cur===o[0]?' selected':'')+'>'+o[1]+'</option>';
    }).join('');
    return '<div class="rcb-field"><label class="rcb-field-label">'+label+'</label>' +
           '<select class="rcb-select" onchange="rcbTbSetElField(\''+k+'\',\''+field+'\',this.value)">'+options+'</select></div>';
  }
  switch(el.type) {
    case 'text': case 'textarea':
      h += field('Label', 'value="'+tbEsc(el.label||'')+'" oninput="rcbTbSetElField(\''+k+'\',\'label\',this.value)"');
      h += field('Placeholder', 'value="'+tbEsc(el.placeholder||'')+'" placeholder="Optional" oninput="rcbTbSetElField(\''+k+'\',\'placeholder\',this.value)"');
      break;
    case 'dropdown':
      h += field('Label', 'value="'+tbEsc(el.label||'')+'" oninput="rcbTbSetElField(\''+k+'\',\'label\',this.value)"');
      h += '<div class="rcb-field"><label class="rcb-field-label">Options</label>';
      (el.options||[]).forEach(function(opt, i) {
        h += '<div class="rcb-tb-opt-row">' +
          '<input class="rcb-input" placeholder="Value" value="'+tbEsc(opt.val)+'" oninput="rcbTbSetOpt(\''+k+'\','+i+',\'val\',this.value)">' +
          '<input class="rcb-input" placeholder="Label" value="'+tbEsc(opt.label)+'" oninput="rcbTbSetOpt(\''+k+'\','+i+',\'label\',this.value)">' +
          '<button class="rcb-tb-el-act rcb-tb-el-del" onclick="rcbTbDelOpt(\''+k+'\','+i+')">×</button>' +
        '</div>';
      });
      h += '<button class="rcb-tb-add-opt-btn" onclick="rcbTbAddOpt(\''+k+'\')">+ Add option</button></div>';
      break;
    case 'button':
      h += field('Button text', 'value="'+tbEsc(el.label||'')+'" oninput="rcbTbSetElField(\''+k+'\',\'label\',this.value)"');
      h += sel('Variant', 'variant', el.variant||'contained', [['contained','Contained'],['outlined','Outlined'],['text','Text'],['plain','Plain']]);
      break;
    case 'message':
      h += field('Text', 'value="'+tbEsc(el.text||'')+'" oninput="rcbTbSetElField(\''+k+'\',\'text\',this.value)"');
      h += sel('Style', 'variant', el.variant||'body1', [['title1','Title 1'],['title2','Title 2'],['subheading1','Subheading'],['body1','Body'],['body2','Body 2'],['caption1','Caption']]);
      break;
    case 'alert':
      h += field('Message', 'value="'+tbEsc(el.text||'')+'" oninput="rcbTbSetElField(\''+k+'\',\'text\',this.value)"');
      h += sel('Severity', 'severity', el.severity||'warning', [['info','Info'],['warning','Warning'],['error','Error'],['success','Success']]);
      break;
  }
  return h;
}

// ── Full render ───────────────────────────────────────────────
function tbRender() {
  tbSave();
  var body = document.getElementById('rcb-tb-body');
  if (!body) return;
  var h = '';

  if (!_tb.tabs.length) {
    body.innerHTML = '<div class="rcb-tb-empty">No tabs yet. Click <strong>+ Add tab</strong> to create your first custom tab — it will appear live in the widget above.</div>';
    renderCode(); return;
  }

  // Pills row
  h += '<div class="rcb-tb-pills">';
  _tb.tabs.forEach(function(tab) {
    var active = tab.id === _tb.sel ? ' rcb-tb-pill-active' : '';
    h += '<div class="rcb-tb-pill'+active+'" onclick="rcbTbSelectTab(\''+tab.id+'\')">' +
         '<span>'+tbEsc(tab.title||'My Tab')+'</span>' +
         '<button class="rcb-tb-pill-del" onclick="event.stopPropagation();rcbTbDeleteTab(\''+tab.id+'\')">×</button>' +
         '</div>';
  });
  h += '</div>';

  // Selected tab editor
  var selTab = _tb.tabs.find(function(t){ return t.id === _tb.sel; });
  if (selTab) {
    h += '<div class="rcb-tb-editor">';

    // Settings row
    h += '<div class="rcb-tb-settings-row">' +
      '<div class="rcb-field"><label class="rcb-field-label">Tab title</label>' +
      '<input class="rcb-input" value="'+tbEsc(selTab.title||'')+'" oninput="rcbTbSetTabField(\''+selTab.id+'\',\'title\',this.value)"></div>' +
      '<div class="rcb-field"><label class="rcb-field-label">Priority</label>' +
      '<input class="rcb-input" type="number" min="0" max="100" value="'+(selTab.priority||31)+'" oninput="rcbTbSetTabField(\''+selTab.id+'\',\'priority\',this.value)"></div>' +
      '<div class="rcb-field"><label class="rcb-field-label">Icon URI <span style="font-weight:400;color:#bbb">(optional, 24×24)</span></label>' +
      '<input class="rcb-input" type="url" value="'+tbEsc(selTab.iconUri||'')+'" placeholder="https://…/icon.png" oninput="rcbTbSetTabField(\''+selTab.id+'\',\'iconUri\',this.value)"></div>' +
    '</div>';

    // Elements list
    h += '<div class="rcb-tb-el-list">';
    if (!selTab.elements.length) {
      h += '<div class="rcb-tb-el-empty">No elements yet. Choose a type from the palette below to add the first one.</div>';
    }
    selTab.elements.forEach(function(el, i) {
      var isExp = el.key === _tb.expEl;
      var typeInfo = _tbTypes.find(function(t){ return t.type === el.type; }) || {icon:'?', label:el.type};
      var preview = el.label || el.text || typeInfo.label;
      h += '<div class="rcb-tb-el-card'+(isExp?' rcb-tb-el-expanded':'')+'">';
      h += '<div class="rcb-tb-el-row" onclick="rcbTbToggleEl(\''+el.key+'\')">' +
        '<i class="rcb-tb-el-icon">'+typeInfo.icon+'</i>' +
        '<span class="rcb-tb-el-type-badge">'+typeInfo.label+'</span>' +
        '<span class="rcb-tb-el-name">'+tbEsc(preview)+'</span>' +
        '<div class="rcb-tb-el-actions">' +
          (i>0?'<button class="rcb-tb-el-act" onclick="event.stopPropagation();rcbTbMoveEl(\''+el.key+'\',\'up\')" title="Move up">↑</button>':'') +
          (i<selTab.elements.length-1?'<button class="rcb-tb-el-act" onclick="event.stopPropagation();rcbTbMoveEl(\''+el.key+'\',\'down\')" title="Move down">↓</button>':'') +
          '<button class="rcb-tb-el-act rcb-tb-el-del" onclick="event.stopPropagation();rcbTbDeleteEl(\''+el.key+'\')" title="Delete">×</button>' +
        '</div>' +
      '</div>';
      if (isExp) h += '<div class="rcb-tb-el-body">' + tbElEditor(el) + '</div>';
      h += '</div>';
    });
    h += '</div>';

    // Element palette
    h += '<div class="rcb-tb-palette-label">Add element</div>';
    h += '<div class="rcb-tb-palette">';
    _tbTypes.forEach(function(t) {
      h += '<button class="rcb-tb-pal-btn" onclick="rcbTbAddEl(\''+t.type+'\')">' +
           '<i class="rcb-tb-pal-icon">'+t.icon+'</i>' +
           '<span>'+t.label+'</span></button>';
    });
    h += '</div>';
    h += '</div>'; // /editor
  }

  body.innerHTML = h;
  renderCode();
}

// Init tab builder
tbRestore();
tbRender();

})();
</script>
