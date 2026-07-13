import '@testing-library/jest-dom';

import { configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';

jest.mock('ringcentral-web-phone', () => require('../mocks/RingCentralWebphoneV2Mock'));

configure({ testIdAttribute: 'data-sign' });

jest.setTimeout(30000);

if (!process.env.BRAND_CONFIGS || typeof process.env.BRAND_CONFIGS === 'string') {
  Object.defineProperty(process.env, 'BRAND_CONFIGS', {
    value: {
      rc: {
        id: '1210',
        code: 'rc',
        name: 'RingCentral',
        appName: 'RingCentral Embeddable',
        signupUrl: 'https://www.ringcentral.com',
        assets: {},
      },
    },
    configurable: true,
    writable: true,
  });
}

class TestBroadcastChannel {
  constructor(name) {
    this.name = name;
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
    this.postMessage = jest.fn();
    this.close = jest.fn();
  }
}

if (typeof window !== 'undefined') {
  window.HTMLMediaElement.prototype.pause = () => {};
  window.HTMLMediaElement.prototype.play = async () => {};
  window.HTMLMediaElement.prototype.load = async () => {};
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  window.URL.createObjectURL = jest.fn();
  window.URL.revokeObjectURL = jest.fn();
  window.open = jest.fn();
  window.BroadcastChannel = TestBroadcastChannel;
}

if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
global.AudioWorkletProcessor = class AudioWorkletProcessor {};
global.registerProcessor = jest.fn();
global.BroadcastChannel = TestBroadcastChannel;
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
