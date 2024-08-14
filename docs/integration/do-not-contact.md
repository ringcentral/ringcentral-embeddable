# Do Not Contact

This is feature to prevent the user to call/message someone who is in the DoNotContact list in your service.

To enable the feature, please pass `doNotContactPath` when you register service.

```js
document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
  type: 'rc-adapter-register-third-party-service',
  service: {
    name: 'TestService',
    doNotContactPath: '/doNotContact',
  }
}, '*');
```

Add a message event to response DoNotContact checking event:

```js
// Function to response message to widget
function responseMessage(request, response) {
  console.log(request);
  document.querySelector("#rc-widget-adapter-frame").contentWindow.postMessage({
    type: 'rc-post-message-response',
    responseId: request.requestId,
    response,
  }, '*');
}

const DO_NOT_CONTACTS_LIST = []; // Your DoNotContact list
window.addEventListener('message', function (e) {
  var data = e.data;
  if (data && data.type === 'rc-post-message-request') {
    const request = data;
    if (request.path === '/doNotContact') {
      // For DoNotContact checking for call
      if (request.body.actionType === 'call') {
        // Check if the phone number is in the DoNotContact list, you can check with your own API/logic
        if (DO_NOT_CONTACTS_LIST.includes(request.body.phoneNumber)) {
          responseMessage(request, {
            data: {
              result: true, // true: do not contact, false: can contact,
              message: 'This is a do not contact message.', // optional, message to show in widget
              mode: 'restrict', // optional, restrict mode to prevent user from calling. Or allow user to force call after warning.
            },
          });
          return;
        }
        // If the phone number is not in the DoNotContact list, you can allow the user to call
        responseMessage(request, {
          data: {
            result: false,
          },
        });
        return;
      }
    }
    // For DoNotContact checking for sms
    if (request.body.actionType === 'sms') {
      // Check if the phone number is in the DoNotContact list, you can check with your own API/logic
      if (request.body.recipients.find((item) => DO_NOT_CONTACTS_LIST.includes(item.phoneNumber))) {
        responseMessage(request, {
          data: {
            result: true, // true: do not contact, false: can contact,
            message: 'This is a do not contact message',
            mode: 'restrict' // optional, restrict mode to prevent user from messaging. Or allow user to force sending after warning.
          },
        });
        return;
      }
      responseMessage(request, {
        data: {
          result: false,
        },
      });
      return;
    }
  }
});
```

When user make a call or send a message, the widget will send request to check if the phone number is in the DoNotContact list. If the phone number is in the DoNotContact list, the widget will show a warning message to the user and prevent the user from calling/messaging. If the phone number is not in the DoNotContact list, the widget will allow the user to call/message.

Restrict mode:

![DoNotContactRestrict](https://github.com/user-attachments/assets/6942acb3-d304-437b-9184-14c178a09889)

No restrict mode:

![DoNotContact](https://github.com/user-attachments/assets/9ccebd5d-5f95-4931-8680-a635e4774cf7)
