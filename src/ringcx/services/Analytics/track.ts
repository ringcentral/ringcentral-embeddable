import {
  getRef,
  type RcModule,
  type RcViewModule,
} from '@ringcentral-integration/next-core';

import { Analytics } from './index';

type TrackEvent =
  | string
  | ((module: any, ...args: any[]) => string | [string, Record<string, any>]);

interface MethodDescriptor extends TypedPropertyDescriptor<(...args: any[]) => any> {
  initializer?: () => (...args: any[]) => any;
}

export function track(trackEvent: TrackEvent) {
  return (
    target: RcModule | RcViewModule,
    name: string,
    descriptor: MethodDescriptor,
  ): any => {
    const original = descriptor.value ?? descriptor.initializer?.();
    if (!original) return descriptor;
    descriptor.value = function (
      this: RcModule | RcViewModule,
      ...args: any[]
    ): any {
      const result = original.apply(this, args);
      try {
        const analytics = getRef(this).container?.got(Analytics);
        const eventResult =
          typeof trackEvent === 'function'
            ? trackEvent(this, ...args)
            : trackEvent;
        const [event, properties] = Array.isArray(eventResult)
          ? eventResult
          : [eventResult, {}];
        void analytics?.track(String(event), properties);
      } catch {
        // Analytics must never block an agent action.
      }
      return result;
    };
    return descriptor;
  };
}
