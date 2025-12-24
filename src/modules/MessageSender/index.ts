import { Module } from '@ringcentral-integration/commons/lib/di';
import * as uuid from 'uuid';
import {
  MessageSender as MessageSenderBase,
  messageSenderStatus,
  messageSenderEvents,
  messageSenderMessages,
  MESSAGE_MAX_LENGTH,
} from '@ringcentral-integration/commons/modules/MessageSender';
import type {
  Attachment,
} from '@ringcentral-integration/commons/modules/MessageSender';
import type GetMessageInfoResponse from 'ringcentral-client/build/definitions/GetMessageInfoResponse';
import chunkMessage from '@ringcentral-integration/commons/lib/chunkMessage';
import { sleep } from '@ringcentral-integration/utils';

const SENDING_THRESHOLD = 30;

@Module({
  name: 'MessageSender',
  deps: [
    'MessageThreads',
  ],
})
export class MessageSender extends MessageSenderBase {
  // TODO: fix noAttachmentToExtension error not idle issue
  async _validateToNumbers(options) {
    const result = await super._validateToNumbers(options);
    this.setSendStatus(messageSenderStatus.idle);
    return result;
  }

  override async send({
    fromNumber,
    toNumbers,
    text,
    replyOnMessageId,
    multipart = false,
    attachments = [],
    groupSMS = false,
  }: {
    fromNumber: string;
    toNumbers: string[];
    text: string;
    replyOnMessageId?: number;
    multipart?: boolean;
    attachments?: Attachment[];
    groupSMS?: boolean;
  }) {
    const eventId = uuid.v4();
    if (!this._validateContent(text, attachments, multipart)) {
      return null;
    }
    try {
      const validateToNumberResult = await this._validateToNumbers(toNumbers);
      if (!validateToNumberResult.result) {
        return null;
      }
      const extensionNumbers = validateToNumberResult.extNumbers;
      const phoneNumbers = validateToNumberResult.noExtNumbers;
      if (extensionNumbers.length > 0 && attachments.length > 0) {
        this._alertWarning(messageSenderMessages.noAttachmentToExtension);
        return null;
      }

      // not validate sender number if recipient is only extension number
      if (phoneNumbers.length > 0) {
        if (!this._validateSenderNumber(fromNumber)) {
          return null;
        }
      }
      this._eventEmitter.emit(messageSenderEvents.send, {
        eventId,
        fromNumber,
        toNumbers,
        text,
        replyOnMessageId,
        multipart,
      });
      const isBulkMessage = Array.isArray(toNumbers) && toNumbers.length > 1;
      const isPager = extensionNumbers.length > 0;
      this._smsAttempt(isBulkMessage, isPager);
      const responses = [];
      const chunks = multipart
        ? chunkMessage(text, MESSAGE_MAX_LENGTH)
        : [text];
      const total = (phoneNumbers.length + 1) * chunks.length;
      const shouldSleep = total > SENDING_THRESHOLD;
      if (extensionNumbers.length > 0) {
        for (const chunk of chunks) {
          if (shouldSleep) await sleep(2000);
          const pagerResponse = await this._sendPager({
            toNumbers: extensionNumbers,
            text: chunk,
            replyOnMessageId,
          });
          responses.push(pagerResponse);
        }
      }
      const isGroup = phoneNumbers.length > 1 && (groupSMS || replyOnMessageId);
      if (isGroup) {
        // send SMS to all recipients at once with group SMS or reply on message
        const smsResponses = await this._sendSMSChunks({
          fromNumber,
          to: phoneNumbers.map(phoneNumber => ({ phoneNumber })),
          chunks,
          attachments,
          shouldSleep,
        });
        responses.push(...smsResponses);
      } else {
        // send SMS to each recipient individually
        for (const phoneNumber of phoneNumbers) {
          const smsResponses = await this._sendSMSChunks({
            fromNumber,
            to: [{ phoneNumber }],
            chunks,
            attachments,
            shouldSleep,
          });
          responses.push(...smsResponses);
        }
      }
      this._smsSentOver();
      return responses;
    } catch (error: any) {
      console.debug('sendComposeText e ', error);
      this._eventEmitter.emit(messageSenderEvents.sendError, {
        eventId,
        fromNumber,
        toNumbers,
        text,
        replyOnMessageId,
        multipart,
      });
      this._smsSentError();
      await this._onSendError(error);
      throw error;
    }
  }

  async _sendSMSChunks({
    fromNumber,
    to,
    chunks,
    attachments = [],
    shouldSleep,
  }: {
    fromNumber: string;
    to: { phoneNumber: string }[];
    chunks: string[];
    attachments?: Attachment[];
    shouldSleep: boolean;
  }): Promise<GetMessageInfoResponse[]> {
    const responses = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (shouldSleep) await sleep(2000);
      let smsResponse;
      const smsBody = {
        fromNumber,
        to,
        text: chunk,
        attachments: i === 0 ? attachments : [], // only send attachments on the first chunk
      };
      if (smsBody.attachments.length > 0) {
        smsResponse = await this._sendMMS(smsBody);
      } else {
        smsResponse = await this._sendSMS(smsBody);
      }
      responses.push(smsResponse);
    }
    return responses;
  }

  async _sendSMS({
    fromNumber,
    to,
    text,
  }: {
    fromNumber: string;
    to: { phoneNumber: string }[];
    text: string;
  }): Promise<GetMessageInfoResponse> {
    let isThread = false;
    if (
      this._deps.messageThreads.hasPermission &&
      to.length === 1
    ) {
      const sender = this.senderNumbersList.find((number) => number.phoneNumber === fromNumber);
      if (sender && sender.extension) {
        isThread = true;
      }
    }
    if (isThread) {
      const message = await this._deps.messageThreads.sendMessage({
        text,
        from: { phoneNumber: fromNumber },
        to,
      });
      return message;
    }
    const response = await this._deps.client
      .account()
      .extension()
      .sms()
      .post({
        from: { phoneNumber: fromNumber },
        to,
        text,
      });
    return response;
  }

  async _sendMMS({
    fromNumber,
    to,
    text,
    attachments = [],
  }: {
    fromNumber: string;
    to: { phoneNumber: string }[];
    text: string;
    attachments?: Attachment[];
  }): Promise<GetMessageInfoResponse> {
    const formData = new FormData();
    const body = {
      from: { phoneNumber: fromNumber },
      to,
      text,
    };
    formData.append(
      'json',
      new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' }),
    );
    attachments.forEach((attachment) => {
      formData.append('attachment', attachment.file);
    });

    const response = await this._deps.client.service
      .platform()
      .post('/restapi/v1.0/account/~/extension/~/sms', formData);
    return response.json();
  }
}
