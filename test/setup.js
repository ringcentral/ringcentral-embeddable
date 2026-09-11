import '@testing-library/jest-dom';

import { configure } from '@testing-library/react';
import { TextDecoder, TextEncoder } from 'util';

configure({ testIdAttribute: 'data-sign' });

jest.setTimeout(30000);

if (typeof Reflect.metadata !== 'function') {
  Reflect.metadata = () => () => {};
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

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: jest.fn(() => ({
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  })),
});

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: jest.fn(),
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: jest.fn(),
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: jest.fn(async () => {}),
});

window.URL.createObjectURL = jest.fn(() => 'blob:test');
window.URL.revokeObjectURL = jest.fn();
window.open = jest.fn();
window.BroadcastChannel = TestBroadcastChannel;

Element.prototype.scrollIntoView = jest.fn();

global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
global.BroadcastChannel = TestBroadcastChannel;
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
global.AudioWorkletProcessor = class AudioWorkletProcessor {};
global.registerProcessor = jest.fn();
