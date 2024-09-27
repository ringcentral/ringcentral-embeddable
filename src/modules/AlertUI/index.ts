import { AlertUI as AlertUIBase } from '@ringcentral-integration/widgets/modules/AlertUI';
import { Module } from '@ringcentral-integration/commons/lib/di';
import type {
  NotificationMessage,
} from '@ringcentral-integration/widgets/components/NotificationPanel/NotificationPanel.interface';
import { getAlertRenderer } from '../../components/AlertRenderer';

@Module({
  name: 'AlertUI',
  deps: ['ThirdPartyService'],
})
export class AlertUI extends AlertUIBase {
  constructor(deps) {
    super(deps);
    this._ignoreModuleReadiness(deps.thirdPartyService);
  }

  getUIFunctions(options) {
    const functions = super.getUIFunctions(options);
    return {
      ...functions,
      getRenderer: (message: NotificationMessage) => {
        const renderer = getAlertRenderer({
          onThirdPartyLinkClick: (id)=> this._deps.thirdPartyService.onClickLinkInAlertDetail(id),
        })(message);
        if (renderer) {
          return renderer;
        }
        return functions.getRenderer(message);
      },
      cancelAutoDismiss: (id) => {
        this._deps.alert.update(id, {
          ttl: 0,
        });
      },
    }; 
  }
}