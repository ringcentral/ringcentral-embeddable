import version from './version';

let url = 'http://localhost:8080';
if (process.env.NODE_ENV === 'production') {
  url = process.env.HOSTING_URL || 'https://embbnux.github.io/ringcentral-widget-demo';
}

const hostingUrl = url;

export default hostingUrl;
