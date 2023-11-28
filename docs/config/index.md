# Configuring RingCentral Embeddable

Listed below are all supported parameters that can be [configured](setting-params.md) for RingCentral Embeddable. For those parameters that warrant greater explanation a link has been provided to content where you can learn more about using the parameter properly. 

<div id="config-table" markdown>

| Parameter | Default | Description |
|-|-|-|
| `appServer` | *production* | Sets the environment in which Embeddable will run. See [Setting your environment](environment.md). |
| `authorizationCode` | *null* | See [Alternative auth methods](../integration/authorization.md). |
| `authorizationCodeVerifier` | *null* | See [Alternative auth methods](../integration/authorization.md). |
| `clientId` | *null* | Sets the client Id credential of your Embeddable application. Useful in removing the FOR DEMO PURPOSES ONLY banner. See [Using a custom client ID](client-id.md). |
| `clientSecret` | None | *Deprecated*. Sets the client secret of your application when using Authorization code grant type. See [Alternative auth methods](../integration/authorization.md). |
| `defaultCallWith` | `browser` | See [Calling features](call-settings.md). |
| `defaultDirection` | `right` | Allowed values are "left" and "right". See [Embeddable Badge](badge.md). |
| `disableMessages` | False | Disable messages feature.  |
| `disableReadText` | False | Disable SMS and read text feature. |
| `disableCall` | False | Disable call-related features. |
| `disableCallHistory` | False | Disable call history. |
| `disableContacts` | False | Disable contacts feature. |
| `disableMeeting` | False | Disable meeting feature. |
| `disableGlip` | True | Before we start to use Glip API, need to add `Glip` or `Team Messaging` permission to your app in RingCentral Developer website. Also, for testing with a sandbox user, user needs to first login to https://app.devtest.ringcentral.com |
| `disableMinimize` | True | By default, we provide Minimize button at app header to minimize the widget. |
| `disconnectInactiveWebphone` | Foo | See [Working with multuple tabs](multiple-tabs.md). |
| `enableAnalytics` | False | See [Custom analytics](../integrations/analytics.md). |
| `enableNoiseReduction` | False | See [Noise reduction](noise-reduction.md). |
| `enablePopup` | Foo | See [Customize pop-up window](popup-window.md). |
| `enableRingtoneSettings` | Foo | For when call is ringing, app will play default ringtone. But we also support to customize ringtone. By enabled, user can get ringtone settings at settings page. Supported after v1.6.3 |
| `jwt` | None | See [Alternative auth methods](../integration/authorization.md). |
| `multipleTabsSupport` | Foo | See [Working with multuple tabs](multiple-tabs.md). |
| `newAdapterUI` | Foo | See [Embeddable Badge](badge.md). |
| `popupPageUri` | Foo | See [Customize pop-up window](popup-window.md). |
| `prefix` | Foo | See [Customize prefix](prefix.md). |
| `redirectUri` | Foo | See [Customize redirectUri](redirect-uri.md). |
| `showSignUpButton` | False |  |
| `stylesUri` | *null* | See [Customize look and feel through CSS](styles.md). |
| `userAgent` |  | See [Customize X-User-Agent](user-agent.md). |

</div>

