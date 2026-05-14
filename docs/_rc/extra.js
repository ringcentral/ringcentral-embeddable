if (window.location.origin === 'https://ringcentral.github.io') {
  const newUri = window.location.href.replace('ringcentral.github.io/rc-unified-crm-extension', 'appconnect.labs.ringcentral.com');

  if (newUri !== window.location.href) {
    window.location.href = newUri;
  }
}
