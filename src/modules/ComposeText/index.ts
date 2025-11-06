import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  action,
  state,
  storage,
} from '@ringcentral-integration/core';
import {
  ComposeText as ComposeTextBase,
} from '@ringcentral-integration/commons/modules/ComposeText';
import type { Attachment } from '@ringcentral-integration/commons/modules/MessageSender';
import type { ToNumber } from '@ringcentral-integration/commons/modules/ComposeText';
import { isBlank } from '@ringcentral-integration/commons/lib/isBlank';

@Module({
  name: 'ComposeText',
  deps: [
    'ModalUI',
    'ThirdPartyService',
  ]
})
export class ComposeText extends ComposeTextBase {
  protected _alertModalId = null;

  smsVerify = async ({ toNumbers, typingToNumber }) => {
    if (!this._deps.thirdPartyService.doNotContactRegistered) {
      return true;
    }
    const recipients = (toNumbers || []).map((item) => ({
      phoneNumber: item.phoneNumber,
      phoneType: item.phoneType,
      contactId: item.contactId,
      name: item.name,
      contactType: item.type,
      entityType: item.entityType,
    }));
    if (typingToNumber) {
      recipients.push({
        phoneNumber: typingToNumber,
      });
    }
    try {
      const doNotContact = await this._deps.thirdPartyService.checkDoNotContact({
        recipients,
        actionType: 'sms',
      });
      if (!doNotContact || !doNotContact.result) {
        return true;
      }
      if (this._alertModalId) {
        this._deps.modalUI.close(this._alertModalId);
        this._alertModalId = null;
      }
      if (doNotContact.mode === 'restrict') {
        this._alertModalId = this._deps.modalUI.alert({
          title: 'Do Not Contact',
          content: doNotContact.message || 'The number is on the Do Not Contact list.',
        });
        return false;
      }
      const confirmed = await this._deps.modalUI.confirm({
        title: 'Do Not Contact',
        content: doNotContact.message || 'The number is on the Do Not Contact list. Do you still want to send message?',
        confirmButtonText: 'Send',
      }, true);
      return confirmed;
    } catch (error) {
      console.error(error);
      return true;
    }
  }

  @storage
  @state
  defaultTextId = '';

  @action
  setDefaultTextId(textId) {
    this.defaultTextId = textId;
  }

  @storage
  @state
  groupSMS = false;

  @action
  setGroupSMS(checked: boolean) {
    this.groupSMS = checked;
  }

  async addToNumber(number: ToNumber) {
    if (isBlank(number.phoneNumber)) {
      return false;
    }
    const isValid = await this._validatePhoneNumber(number.phoneNumber);
    if (!isValid) {
      return false;
    }
    if (this.groupSMS && this.toNumbers.length >= 10) {
      this._deps.alert.warning({
        message: 'maxGroupSMSLimitReached',
      });
      return false;
    }
    this._addToNumber(number);
    return true;
  }

  override _initSenderNumber() {
    super._initSenderNumber();
    const defaultTextId = this.defaultTextId;
    if (
      defaultTextId &&
      this._deps.messageSender.senderNumbersList.find(
        (number) => number.phoneNumber === defaultTextId
      )
    ) {
      // if the default text id is valid, use it
      return;
    }
    this.setDefaultTextId('');
  }

  override async send(text: string, attachments: Attachment[] = []) {
    const toNumbers = this.toNumbers.map((number) => number.phoneNumber);
    const { typingToNumber } = this;
    if (!isBlank(typingToNumber)) {
      if (await this._validatePhoneNumber(typingToNumber)) {
        toNumbers.push(typingToNumber);
      } else {
        return null;
      }
    }

    const continueSend = this.smsVerify
      ? await this.smsVerify({ toNumbers: this.toNumbers, typingToNumber })
      : true;
    if (!continueSend) return null;

    let timeoutID = setTimeout(() => {
      if (this._deps.routerInteraction?.currentPath === '/composeText') {
        this.alertMessageSending();
      }
      // @ts-expect-error
      timeoutID = null;
    }, 10000);

    try {
      const responses = await this._deps.messageSender.send({
        fromNumber: this.senderNumber,
        toNumbers,
        text,
        attachments,
        groupSMS: this.groupSMS,
      });

      if (timeoutID) {
        clearTimeout(timeoutID);
        timeoutID = null;
      }
      this.dismissMessageSending();
      return responses;
    } catch (err) {
      if (timeoutID) {
        clearTimeout(timeoutID);
        timeoutID = null;
      }
      throw err;
    }
  }
}
