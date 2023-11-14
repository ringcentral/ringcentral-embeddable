# Registering your application

Before you begin development, you will first need to register your application via the RingCentral Developer Console. This step will provision your application a unique set of credentials used to identify your application on the network, and comes with the benefits listed below.

### Benefits

* Your application will be less likely impacted by users of other instances of Embeddable
* You will have visibility into the analytics of your user's use of your Embeddable application
* You will be able to better customize your instance of Embeddable
* The "FOR DEMO PURPOSES ONLY" banner will be removed from your application

## Steps in registering an application

1. Login to the [Developer Console](https://developers.ringcentral.com/login.html), creating an account as necessary.

2. Click "Register App"

3. Select "REST API App" and click "Next."

4. Under the Auth section:
    * Select "3-legged OAuth flow authorization code" 
	* Select "Client-side web app, e.g. SPA, Javascript"
    * Set "OAuth Redirect URI" to:
	  
	     `https://ringcentral.github.io/ringcentral-embeddable/redirect.html`

5. Under the Security section, add the following "Application scopes:"
    * `Call Control`
    * `Edit Message`
    * `Edit Presence`
    * `Internal Messages`
    * `Read Accounts`
    * `Read Call Log`
    * `Read Contacts`
    * `Read Messages`
    * `Read Presence`
    * `RingOut`
    * `SMS`
    * `TeamMessaging` (optional)
    * `WebSocketSubscription`
    * `Video` (optional)
    * `VoIP Calling`

For all other parameters you are free to select whatever values your prefer. Consult the Developer Guide to learn more about [app registration](https://developers.ringcentral.com/guide/getting-started/register-app).
