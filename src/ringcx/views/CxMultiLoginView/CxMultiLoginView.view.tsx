import {
  ModalView,
  useModalItemView,
} from '@ringcentral-integration/micro-core/src/app/views';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  injectable,
  portal,
  RcViewModule,
} from '@ringcentral-integration/next-core';
import { Button } from '@ringcentral/spring-ui';
import React from 'react';

import i18n from './i18n';

/**
 * CxMultiLoginView - Modal view for handling multiple login confirmation
 * Shows when EXISTING_LOGIN_FOUND status is returned from server
 */
@injectable({
  name: 'CxMultiLoginView',
})
class CxMultiLoginView extends RcViewModule {
  constructor(
    private modalView: ModalView,
  ) {
    super();
  }

  /**
   * Multi-login confirmation modal content component
   */
  private MultiLoginConfirmContent = () => {
    const { action } = useModalItemView();
    const { t } = useLocale(i18n);

    return (
      <div className="m-4 flex flex-col gap-3" data-sign="multiLoginConfirmation">
        <h3 className="typography-title" data-sign="multiLoginTitle">
          {t('multipleLoginsTitle')}
        </h3>
        <p className="typography-mainText" data-sign="multiLoginContent">
          {t('multipleLoginsContent')}
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <div data-sign="multiLoginConfirm">
            <Button
              fullWidth
              size="xlarge"
              onClick={() => action?.confirm()}
            >
              {t('multipleLoginsConfirm')}
            </Button>
          </div>
          <div data-sign="multiLoginCancel">
            <Button
              fullWidth
              size="xlarge"
              variant="outlined"
              onClick={() => action?.cancel()}
            >
              {t('multipleLoginsCancel')}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Multi-login confirmation modal
   */
  @portal
  private multiLoginConfirm = this.modalView.create({
    view: () => <this.MultiLoginConfirmContent />,
    props: () => ({
      type: 'drawer',
      header: null,
      disableBackdropClick: true,
      'aria-label': 'multi-login confirmation',
    }),
  });

  /**
   * Show multi-login confirmation modal and return user's choice
   * @returns true if user confirms, false if user cancels
   */
  async showConfirm(): Promise<boolean> {
    const result = this.modalView.open(this.multiLoginConfirm);
    return result.closed.then((answer) => !!answer);
  }

  /**
   * Component method required by RcViewModule (not rendered directly)
   */
  component() {
    return null;
  }
}

export { CxMultiLoginView };
