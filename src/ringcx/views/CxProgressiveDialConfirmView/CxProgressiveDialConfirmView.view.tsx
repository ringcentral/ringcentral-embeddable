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
 * An open "Required state change" prompt
 */
export interface GoAvailableConfirm {
  answer: Promise<boolean>;
  close: () => void;
}

/**
 * CxProgressiveDialConfirmView - "Required state change" modal of the
 * progressive dialer, shown when the agent starts dialing while not available
 */
@injectable({
  name: 'CxProgressiveDialConfirmView',
})
class CxProgressiveDialConfirmView extends RcViewModule {
  constructor(private modalView: ModalView) {
    super();
  }

  private GoAvailableConfirmContent = () => {
    const { action } = useModalItemView();
    const { t } = useLocale(i18n);
    return (
      <div className="m-4 flex flex-col gap-3" data-sign="goAvailableConfirmation">
        <h3 className="typography-title" data-sign="goAvailableTitle">
          {t('requiredStateChange')}
        </h3>
        <p className="typography-mainText" data-sign="goAvailableContent">
          {t('goAvailableMessage')}
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <Button
            fullWidth
            size="xlarge"
            onClick={() => action?.confirm()}
            data-sign="goAvailableConfirm"
          >
            {t('goAvailable')}
          </Button>
          <Button
            fullWidth
            size="xlarge"
            variant="outlined"
            onClick={() => action?.cancel()}
            data-sign="goAvailableDismiss"
          >
            {t('dismiss')}
          </Button>
        </div>
      </div>
    );
  };

  @portal
  private goAvailableConfirm = this.modalView.create({
    view: () => <this.GoAvailableConfirmContent />,
    props: () => ({
      type: 'drawer',
      header: null,
      disableBackdropClick: true,
      'aria-label': 'go available confirmation',
    }),
  });

  /**
   * Asks the agent to go available, before the progressive dialer starts or
   * when the agent is left in another state after a call.
   * Open it from the server port: the answer resolves on the opener port.
   * @returns `answer`, true when the agent chose Go available, and `close`
   * to take the prompt away when it is no longer needed
   */
  openGoAvailableConfirm(): GoAvailableConfirm {
    const instance = this.modalView.open(this.goAvailableConfirm);
    return {
      answer: instance.closed.then((answer) => !!answer),
      close: () => instance.close(),
    };
  }

  /**
   * Component method required by RcViewModule (not rendered directly)
   */
  component() {
    return null;
  }
}

export { CxProgressiveDialConfirmView };
