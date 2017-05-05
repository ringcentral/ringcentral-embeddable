import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import Phone from './Phone';
import App from './containers/App';
import apiConfig from './api-config';
import brandConfig from './brandConfig';
import version from './version';
import prefix from './prefix';

const phone = new Phone({
  apiConfig,
  brandConfig,
  prefix,
  appVersion: version,
});

const store = createStore(phone.reducer);

phone.setStore(store);

window.phone = phone;

ReactDOM.render(
  <App
    phone={phone}
  />,
  document.querySelector('div#viewport'),
);

