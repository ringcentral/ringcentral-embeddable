import { isInbound } from '@ringcentral-integration/commons/lib/callLogHelpers';
import {
  PhoneBorder,
  SmsBorder,
  People,
  AddMemberBorder,
  NewAction,
  ViewLogBorder,
  Edit,
  Download,
  Refresh,
  AiSmartNotes,
} from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/CallItem/i18n';
import { checkShouldHideContactUser } from '@ringcentral-integration/widgets/lib/checkShouldHideContactUser';
import { formatNumber } from '@ringcentral-integration/commons/lib/formatNumber';

export function getPhoneNumber(call) {
  if (isInbound(call)) {
    return call.from?.phoneNumber || call.from?.extensionNumber || '';
  }
  return call.to?.phoneNumber || call.to?.extensionNumber || '';
};

export function getContactMatches(call) {
  return (isInbound(call) ? call.fromMatches : call.toMatches) || [];
};

export function getFallbackContactName(call) {
  return isInbound(call) ? call.from!.name : call.to?.name;
};

export function getInitialContactIndex(call, showContactDisplayPlaceholder, isLoggedContact) {
  const contactMatches = getContactMatches(call)!;
  
  const activityMatches = call.activityMatches || [];
  for (const activity of activityMatches) {
    const index = contactMatches.findIndex((contact) =>
      isLoggedContact?.(call, activity, contact),
    );
    if (index > -1) return index;
  }
  if (call.toNumberEntity) {
    const index = contactMatches.findIndex(
      (contact) => contact.id === call.toNumberEntity,
    );
    return index;
  }
  return showContactDisplayPlaceholder ? -1 : 0;
}

export function getSelectedContact(isSelected, call) {
  const contactMatches = getContactMatches(call);
  return (
    (isSelected > -1 && contactMatches[isSelected]) ||
    (contactMatches.length === 1 && contactMatches[0]) ||
    null
  );
};

export function getActions({
  call,
  isExtension,
  showLogButton,
  hideEditLogButton,
  logButtonTitle,
  logCall,
  disableLinks,
  isLogging,
  onClickToDial,
  currentLocale,
  selected,
  disableCallButton,
  disableClickToDial,
  readTextPermission,
  onClickToSms,
  countryCode,
  areaCode,
  maxExtensionNumberLength = 6,
  enableContactFallback,
  internalSmsPermission,
  outboundSmsPermission,
  onViewSmartNote,
  aiNoted,
  enableCDC,
  onViewContact,
  onCreateContact,
  createSelectedContact,
  onRefreshContact,
  isRecording,
  onDownload,
}) {
  const {
    direction,
    activityMatches = [],
  } = call;
  const actions: any[] = [];
  const isLogged = activityMatches.length > 0 && activityMatches.find(
    (activity) => activity.type !== 'status',
  );
  const statusMatch = activityMatches.find(
    (activity) => activity.type === 'status',
  );
  const isFax = call.type === 'Fax';
  const phoneNumber = getPhoneNumber(call);
  const disableClickToSms = !(
    onClickToSms &&
    (isExtension ? internalSmsPermission : outboundSmsPermission)
  );
  const fallbackContactName = getFallbackContactName(call);
  const contactMatches = getContactMatches(call);
  const isContactMatchesHidden = enableCDC && checkShouldHideContactUser(contactMatches);
  if (
    showLogButton &&
    !isFax &&
    (!isLogged || !hideEditLogButton)
  ) {
    actions.push({
      id: 'log',
      icon: isLogged ? Edit : NewAction,
      title: (isLogged ? 'Edit log' : logButtonTitle) || 'Log call',
      onClick: () => logCall(true, undefined, isLogged ? 'editLog' : 'createLog'),
      disabled: disableLinks || isLogging || statusMatch && statusMatch.status === 'pending',
    });
  }
  if (onClickToDial) {
    actions.push({
      id: 'c2d',
      icon: PhoneBorder,
      title: i18n.getString('call', currentLocale),
      onClick: () => {
          if (onClickToDial) {
            const contact = getSelectedContact(selected, call) || {};
            const phoneNumber = getPhoneNumber(call);
      
            if (phoneNumber) {
              onClickToDial({
                ...contact,
                phoneNumber,
              });
            }
          }
        },
      disabled: disableLinks || disableCallButton || disableClickToDial,
    });
  }
  if (onClickToSms) {
    actions.push({
      id: 'c2sms',
      icon: SmsBorder,
      title: i18n.getString('text', currentLocale),
      onClick: () => {
        if (!onClickToSms) return;
        const phoneNumber = getPhoneNumber(call)!;
        const contact = getSelectedContact(selected, call);
        if (contact) {
          onClickToSms({
            ...contact,
            phoneNumber,
          });
        } else {
          const formatted = formatNumber({
            phoneNumber,
            countryCode,
            areaCode,
            maxExtensionLength: maxExtensionNumberLength,
          });
          onClickToSms(
            {
              name: enableContactFallback ? getFallbackContactName(call) : formatted,
              phoneNumber,
            },
            true,
          );
        }
      },
      disabled: disableLinks || disableClickToSms || !phoneNumber || !readTextPermission,
    });
  }
  const hasEntity = !!contactMatches.length;
  if (onViewSmartNote && aiNoted) {
    actions.push({
      id: 'viewSmartNote',
      icon: AiSmartNotes,
      title: 'View smart note',
      onClick: () => onViewSmartNote({
        telephonySessionId: call.telephonySessionId,
        phoneNumber,
        contact: hasEntity ? contactMatches[0] : {
          name: fallbackContactName,
          phoneNumber,
        },
        direction,
      }),
      disabled: disableLinks,
      color: 'label.purple01',
    });
  }
  
  if (!isContactMatchesHidden && hasEntity) {
    const viewSelectedContact = () => {
      if (typeof onViewContact !== 'function') return;
  
      const activityMatches = (call && call.activityMatches) || [];
      onViewContact({
        activityMatches,
        contactMatches: getContactMatches(call),
        contact: getSelectedContact(selected, call),
        phoneNumber: getPhoneNumber(call),
      });
    };
    actions.push({
      id: 'viewContact',
      icon: People,
      title: "View contact details",
      onClick: viewSelectedContact,
      disabled: disableLinks,
    });
  }
  if (!hasEntity && phoneNumber && onCreateContact) {
    actions.push({
      id: 'createContact',
      icon: AddMemberBorder,
      title: i18n.getString('addEntity', currentLocale),
      onClick: () => createSelectedContact(undefined),
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
  if (isRecording) {
    actions.push({
      id: 'download',
      icon: Download,
      title: 'Download',
      onClick: onDownload,
      disabled: disableLinks,
    });
  }
  if (showLogButton && isLogged && !isFax) {
    actions.push({
      id: 'viewLog',
      icon: ViewLogBorder,
      title: 'View log details',
      onClick: () => logCall(true, undefined, 'viewLog'),
      disabled: disableLinks || isLogging,
    });
  }
  return actions;
}