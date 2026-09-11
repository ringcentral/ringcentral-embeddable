import {
  BrowserLogger,
  Toast,
} from '@ringcentral-integration/micro-core/src/app/services';
import {
  injectable,
  RcViewModule,
  RouterPlugin,
  useConnector,
} from '@ringcentral-integration/next-core';
import type { ReactElement } from 'react';
import React, { useRef } from 'react';

import { ApplicationLogsPanel } from './ApplicationLogsPanel';
import i18n from './i18n';

@injectable({
  name: 'ApplicationLogsView',
})
export class ApplicationLogsView extends RcViewModule {
  constructor(
    private readonly _browserLogger: BrowserLogger,
    private readonly _router: RouterPlugin,
    private readonly _toast: Toast,
  ) {
    super();
  }

  private async downloadLogs(): Promise<void> {
    try {
      await this._browserLogger.saveLog();
      this._toast.success({ message: i18n.getString('downloadSuccess') });
    } catch (error) {
      this.logger.error('Failed to download application logs', error);
      this._toast.danger({ message: i18n.getString('downloadFailure') });
    }
  }

  component(): ReactElement {
    const isDownloading = useConnector(
      () => this._browserLogger.downloading,
    );
    const { current: uiFunctions } = useRef({
      onBack: () => this._router.goBack(),
      onDownload: () => void this.downloadLogs(),
    });
    return (
      <ApplicationLogsPanel
        isDownloading={isDownloading}
        {...uiFunctions}
      />
    );
  }
}
