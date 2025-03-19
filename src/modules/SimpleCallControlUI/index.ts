import { SimpleCallControlUI as SimpleCallControlUIBase }  from '@ringcentral-integration/widgets/modules/SimpleCallControlUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'NewSimpleCallControlUI',
  deps: [],
})
export class SimpleCallControlUI extends SimpleCallControlUIBase {
  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      updateSessionMatchedContact: (telephonySessionId, contact) => {
        this._deps.contactMatcher.setCallMatched({
          telephonySessionId,
          toEntityId: contact.id
        });
      }
    };
  }
}