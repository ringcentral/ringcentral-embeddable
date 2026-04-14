import React from 'react';
import {
  action,
  injectable,
  portal,
  RcModule,
  state,
  delegate,
  PortManager,
} from '@ringcentral-integration/next-core';
import { Toast } from '@ringcentral-integration/micro-core/src/app/services';
import {
  ModalView,
} from '@ringcentral-integration/micro-core/src/app/views';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import {
  delegateInActiveTab,
  setupActiveTabDelegate,
} from '../../../../lib/delegateInActiveTab';
import i18n from './i18n';

interface MeetingInfo {
  details: string;
}

@injectable({
  name: 'MeetingInviteView',
})
export class MeetingInviteView extends RcModule {
  constructor(
    private _modalView: ModalView,
    private _toast: Toast,
    private _portManager: PortManager,
  ) {
    super();
    setupActiveTabDelegate(this, this._portManager);
  }

  @state
  meetingString: string = '';

  @action
  private _setMeetingString(meetingString: string): void {
    this.meetingString = meetingString;
  }

  @delegateInActiveTab
  private async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
      .then(() => {
        this._toast.success({
          message: i18n.getString('copiedToClipboard'),
        });
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        this._toast.danger({
          message: i18n.getString('failedToCopy'),
        });
      });
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    this._toast.success({
      message: i18n.getString('copiedToClipboard'),
    });
  }

  @portal
  private meetingInviteModal = this._modalView.create({
    view: () => {
      const { t } = useLocale(i18n);
      return (
        <textarea
          className="w-full border border-neutral-l02 rounded-lg px-3 py-2 text-caption1 text-neutral-f05 bg-neutral-b02 resize-none focus:outline-none"
          value={this.meetingString}
          readOnly
          rows={8}
          title={t('meetingInviteDetails')}
          aria-label={t('meetingInviteDetails')}
          data-sign="meetingInviteText"
        />
      );
    },
    props: () => ({
      header: i18n.getString('meetingAdded'),
      variant: 'confirm' as const,
      confirmButtonText: i18n.getString('copyToClipboard'),
      cancelButtonText: i18n.getString('cancel'),
      disableBackdropClick: false,
      ['data-sign']: 'meetingInviteModal',
      onConfirm: () => {
        this.copyToClipboard(this.meetingString);
      },
    }),
  });

  @delegate('server')
  async showModal(meetingInfo: MeetingInfo): Promise<void> {
    this._setMeetingString(meetingInfo.details);
    this._modalView.open(this.meetingInviteModal);
  }
}
