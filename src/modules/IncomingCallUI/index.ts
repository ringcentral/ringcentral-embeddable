import { IncomingCallUI as IncomingCallUIBase } from '@ringcentral-integration/widgets/modules/IncomingCallUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'IncomingCallUI',
})
export class IncomingCallUI extends IncomingCallUIBase {
  // getUIProps(options) {
  //   const props = super.getUIProps(options);
  //   // console.log(JSON.stringify(props, null, 2));
  //   return {
  //     ...props,
  //   };
  // }

  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      ignore: (sessionId) => this._deps.webphone.ignore(sessionId),
    }; 
  }
}
