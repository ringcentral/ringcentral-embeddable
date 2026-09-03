import { callDirection } from "@ringcentral-integration/commons/enums/callDirections";

import type { CompatibleCall } from "../../services/CallLogger";
import type { ThirdPartyPage, UnknownRecord } from "../../services/ThirdParty";

interface LogCallPageLabels {
  addCallLogNote: string;
  contact: string;
  editLog: string;
  logCall: string;
  note: string;
  save: string;
}

type CompatibleContact = {
  description?: string;
  id?: string;
  name?: string;
};

export function getLoggedActivity(call: CompatibleCall) {
  return call.activityMatches?.find(({ type }) => type !== "status");
}

function getMatchedContacts(call: CompatibleCall): CompatibleContact[] {
  const matches =
    call.direction === callDirection.inbound
      ? call.fromMatches
      : call.toMatches;
  return (matches ?? []) as CompatibleContact[];
}

function getLoggedContactId(call: CompatibleCall): string {
  const activity = getLoggedActivity(call);
  if (activity?.contactId) {
    return activity.contactId;
  }
  return typeof activity?.contact === "string"
    ? activity.contact
    : activity?.contact?.id ||
        call.callSelectionInfo?.displayedSelection.id ||
        "";
}

export function createDefaultLogCallPage(
  call: CompatibleCall,
  labels: LogCallPageLabels
): ThirdPartyPage {
  const schemaProperties: UnknownRecord = {};
  const formData: UnknownRecord = {};
  const uiSchema: NonNullable<ThirdPartyPage["uiSchema"]> = {
    submitButtonOptions: { submitText: labels.save },
  };
  const contacts = getMatchedContacts(call).filter(
    (contact): contact is CompatibleContact & { id: string } =>
      Boolean(contact.id)
  );
  if (contacts.length > 0) {
    schemaProperties.contactId = {
      oneOf: contacts.map(({ description, id, name }) => ({
        const: id,
        description,
        title: name || id,
      })),
      title: labels.contact,
      type: "string",
    };
    formData.contactId = getLoggedContactId(call) || contacts[0].id;
  }
  schemaProperties.note = {
    title: labels.note,
    type: "string",
  };
  formData.note = getLoggedActivity(call)?.note || call.aiNote || "";
  uiSchema.note = {
    "ui:placeholder": labels.addCallLogNote,
    "ui:widget": "textarea",
  };
  return {
    id: "$LOG-CALL",
    title: getLoggedActivity(call) ? labels.editLog : labels.logCall,
    schema: {
      properties: schemaProperties,
      type: "object",
    },
    formData,
    uiSchema,
  };
}

export function resolveLogCallPage(
  call: CompatibleCall,
  customizedPage: ThirdPartyPage | undefined,
  labels: LogCallPageLabels,
  logButtonTitle: string | null
): ThirdPartyPage {
  const fallbackPage = createDefaultLogCallPage(call, labels);
  if (!customizedPage?.schema) {
    return {
      ...fallbackPage,
      title: getLoggedActivity(call)
        ? labels.editLog
        : logButtonTitle || labels.logCall,
    };
  }
  return {
    ...customizedPage,
    title:
      customizedPage.title ||
      (getLoggedActivity(call)
        ? labels.editLog
        : logButtonTitle || labels.logCall),
  };
}
