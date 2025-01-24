import {
  ViewBorder,
  Download,
  Read,
  Unread,
  PhoneBorder,
  SmsBorder,
  People,
  AddMemberBorder,
  Delete,
  AddTextLog,
  Refresh,
} from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/MessageItem/i18n';
import { extensionTypes } from '@ringcentral-integration/commons/enums/extensionTypes';
import messageTypes from '@ringcentral-integration/commons/enums/messageTypes';
import parseNumber from '@ringcentral-integration/commons/lib/parseNumber';

import { checkShouldHideContactUser } from '@ringcentral-integration/widgets/lib/checkShouldHideContactUser';

export function getPhoneNumber(conversation) {
  const { correspondents } = conversation;
  const phoneNumber = (
    (correspondents.length === 1 &&
      correspondents[0] &&
      (correspondents[0].phoneNumber || correspondents[0].extensionNumber)) ||
    undefined
  );
  return phoneNumber;
}

export function getInitialContactIndex({
  correspondentMatches,
  lastMatchedCorrespondentEntity,
  showContactDisplayPlaceholder,
}) {
  if (lastMatchedCorrespondentEntity) {
    const index = correspondentMatches.findIndex(
      (contact) => contact.id === lastMatchedCorrespondentEntity.id,
    );
    if (index > -1) return index;
  }
  return showContactDisplayPlaceholder ? -1 : 0;
}

export function getSelectedContact(selected, correspondentMatches){
  const contactMatches = correspondentMatches;
  return (
    (selected > -1 && contactMatches[selected]) ||
    (contactMatches.length === 1 && contactMatches[0]) ||
    null
  );
};

export function getActions({
  areaCode,
  countryCode,
  currentLocale,
  conversation,
  disableCallButton = false,
  disableClickToDial = false,
  enableCDC = false,
  internalSmsPermission = true,
  maxExtensionNumberLength = 6,
  markMessage,
  logButtonTitle = '',
  outboundSmsPermission = true,
  onClickToDial,
  onClickToSms,
  onViewContact,
  onCreateContact,
  createSelectedContact,
  onRefreshContact,
  previewFaxMessages,
  showLogButton = false,
  updateTypeFilter = undefined,
  unmarkMessage,
  logConversation,
  disableLinks,
  selected,
  onDownload,
  onDelete,
  isLogging,
}) {
  const {
    conversationId,
    unreadCounts,
    correspondents,
    correspondentMatches,
    conversationMatches = [],
    type,
    voicemailAttachment,
    faxAttachment,
  } = conversation;
  const phoneNumber = getPhoneNumber(conversation);
  const isContactMatchesHidden =
      enableCDC && checkShouldHideContactUser(correspondentMatches);
  let disableClickToSms = false;
  if (phoneNumber) {
    const parsedInfo = parseNumber({
      phoneNumber,
      countryCode,
      areaCode,
      maxExtensionLength: maxExtensionNumberLength,
    });
    const isExtension =
      !parsedInfo.hasPlus &&
      parsedInfo.number &&
      parsedInfo.number.length <= maxExtensionNumberLength;
    disableClickToSms = !(
      onClickToSms &&
      (isExtension ? internalSmsPermission : outboundSmsPermission)
    );
  }
  const selectedContact = getSelectedContact(selected, correspondentMatches);
  const hasEntity = (
    correspondents.length === 1 &&
    !!correspondentMatches.length &&
    (selectedContact?.type ?? '') !== extensionTypes.ivrMenu
  );
  let downloadUri = null;
  if (faxAttachment) {
    downloadUri = faxAttachment.uri;
  } else if (voicemailAttachment) {
    downloadUri = voicemailAttachment.uri;
  }
  const matchEntities = correspondentMatches || [];
  const matchEntitiesIds = matchEntities.map((item) => item.id);
  const isLogged = conversationMatches.filter((match) =>
    match.type !== 'status'
  ).length > 0;
  const actions: {
    id: string;
    icon: any;
    title: string;
    onClick: (...args: any[]) => any;
    disabled: boolean;
    sub?: boolean;
  }[] = [];
  if (showLogButton) {
    actions.push({
      id: 'log',
      icon: AddTextLog,
      title: logButtonTitle || (isLogged ? 'Edit log' : i18n.getString('addLog', currentLocale)),
      onClick: logConversation,
      disabled: disableLinks || isLogging ,
    });
  }
  if (type !== messageTypes.fax && onClickToDial) {
    actions.push({
      id: 'c2d',
      icon: PhoneBorder,
      title: i18n.getString('call', currentLocale),
      onClick: () => {
        if (onClickToDial) {
          const contact = getSelectedContact(selected, correspondentMatches) || {};
          if (phoneNumber) {
            onClickToDial({
              ...contact,
              phoneNumber,
              fromType: type,
            });
          }
        }
      },
      disabled: disableLinks || disableCallButton || disableClickToDial || !phoneNumber,
    });
  }
  if (type === messageTypes.voiceMail && onClickToSms) {
    actions.push({
      id: 'c2sms',
      icon: SmsBorder,
      title: i18n.getString('text', currentLocale),
      onClick: () => {
        if (onClickToSms) {
          const contact = getSelectedContact(selected, correspondentMatches) || {};

          if (phoneNumber) {
            updateTypeFilter && updateTypeFilter(messageTypes.text);
            onClickToSms({
              ...contact,
              phoneNumber,
            });
          }
        }
      },
      disabled: disableLinks || disableClickToSms || !phoneNumber,
    });
  }
  actions.push({
    id: 'mark',
    icon: unreadCounts > 0 ? Unread : Read,
    title: unreadCounts > 0 ? 'Mark as read' : 'Mark as unread',
    onClick: unreadCounts > 0 ? () => {
      if (unreadCounts > 0) {
        unmarkMessage(conversationId);
      }
    } : () => {
      if (unreadCounts === 0) {
        markMessage(conversationId);
      }
    },
    disabled: disableLinks,
    sub: true,
  });
  if (type === messageTypes.fax) {
    actions.push({
      id: 'preview',
      icon: ViewBorder,
      title: i18n.getString('preview', currentLocale),
      onClick: () => {
        previewFaxMessages(faxAttachment.uri, conversationId);
      },
      disabled: disableLinks || !faxAttachment,
      sub: true,
    });
  }
  if (downloadUri) {
    actions.push({
      id: 'download',
      icon: Download,
      title: i18n.getString('download', currentLocale),
      onClick: onDownload,
      disabled: disableLinks,
      sub: true,
    });
  }
  if (!isContactMatchesHidden || hasEntity) {
    actions.push({
      id: 'viewContact',
      icon: People,
      title: 'View contact details',
      onClick: (e) => {
        e && e.stopPropagation();
        if (typeof onViewContact === 'function') {
          onViewContact({
            contact: getSelectedContact(selected, correspondentMatches),
            contactMatches: matchEntities,
            phoneNumber,
            matchEntitiesIds,
          });
        }
      },
      disabled: disableLinks,
    });
  }
  if (!hasEntity && phoneNumber && onCreateContact) {
    actions.push({
      id: 'createContact',
      icon: AddMemberBorder,
      title: i18n.getString('addEntity', currentLocale),
      onClick: createSelectedContact,
      disabled: disableLinks,
    });
  }
  if (phoneNumber && onRefreshContact) {
    actions.push({
      id: 'refreshContact',
      icon: Refresh,
      title: 'Refresh contact',
      onClick: () => {
        onRefreshContact({
          phoneNumber,
        });
      },
      disabled: disableLinks,
    });
  }
  if (type === messageTypes.fax || type === messageTypes.voiceMail) {
    actions.push({
      id: 'delete',
      icon: Delete,
      title: i18n.getString('delete', currentLocale),
      onClick: onDelete,
      disabled: disableLinks,
    });
  }
  return actions;
}