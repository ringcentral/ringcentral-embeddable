import { RingCentralExtensions as RingCentralExtensionsBase } from '@ringcentral-integration/commons/modules/RingCentralExtensions';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewRingCentralExtensions',
  deps: ['WebSocketReadyController'],
})
export class RingCentralExtensions extends RingCentralExtensionsBase {
  // ...
}