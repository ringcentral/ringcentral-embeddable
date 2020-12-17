import { MultipleTabsTransport } from '../../lib/MultipleTabsTransport';

export function multipleTabsProxify(
  prototype: object,
  property: string,
  descriptor: TypedPropertyDescriptor<(...args: any) => Promise<any>>,
) {
  const { configurable, enumerable, value } = descriptor;

  function proxyFn(
    // TODO: fix type
    this: {
      _multipleTabsTransport: MultipleTabsTransport;
      activeWebphoneId: string;
      _tabManager: any;
    },
    ...args: any
  ) {
    if (!this._multipleTabsTransport) {
      return value.call(this, ...args);
    }
    if (this.activeWebphoneId === this._tabManager.id) {
      return value.call(this, ...args);
    }
    return this._multipleTabsTransport.request({
      tabId: this.activeWebphoneId,
      payload: {
        type: 'execute',
        funcName: property,
        args,
      },
    });
  }
  return {
    configurable,
    enumerable,
    value: proxyFn,
  };
}

export const PROXIFY_FUNCTIONS = [
  'answer',
  'makeCall',
  'reject',
  'resume',
  'forward',
  'mute',
  'unmute',
  'hold',
  'unhold',
  'startRecord',
  'stopRecord',
  'park',
  'transfer',
  'transferWarm',
  'flip',
  'sendDTMF',
  'hangup',
  'toVoiceMail',
  'replyWithMessage',
  'switchCall',
  'setSessionCaching',
  'updateSessionMatchedContact',
  'clearSessionCaching',
  'toggleMinimized',
];
