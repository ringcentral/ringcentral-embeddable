import { AlertUI as AlertUIBase } from '@ringcentral-integration/widgets/modules/AlertUI';
import { Module } from '@ringcentral-integration/commons/lib/di';

@Module({
  name: 'AlertUI',
})
export class AlertUI extends AlertUIBase {
  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      cancelAutoDismiss: (id) => {
        this._deps.alert.update(id, {
          ttl: 0,
        });
      }
    }; 
  }
}