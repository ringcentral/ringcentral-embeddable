console.log('From extra.js');
if (window.location.origin === 'https://ringcentral.github.io') {
  const newUri = window.location.href.replace('ringcentral.github.io/ringcentral-embeddable/docs', 'embeddable.labs.ringcentral.com');

  if (newUri !== window.location.href) {
    window.location.href = newUri;
  }
}