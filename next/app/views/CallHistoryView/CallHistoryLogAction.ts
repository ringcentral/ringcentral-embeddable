import type {
  CallLogger,
  HistoryCall,
} from "@ringcentral-integration/micro-phone/src/app/services";
import type { RouterPlugin } from "@ringcentral-integration/next-core";
import type { HistoryAction } from "@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons";

import { getLoggedContact } from "../../services/MatchedContactSelection";
import type { ThirdParty } from "../../services/ThirdParty";

type ActivityMatch = {
  status?: string;
  type?: string;
};

type CallWithActivityMatches = Pick<HistoryCall, "type"> & {
  activityMatches?: Array<ActivityMatch | string>;
};

type CallContactMatch = HistoryCall["fromMatches"][number];

type CallWithContactMatches = CallWithActivityMatches & {
  direction?: string;
  fromMatches?: CallContactMatch[];
  toMatches?: CallContactMatch[];
};

export function addCallHistoryLogStatus<T extends CallWithActivityMatches>(
  call: T
): T & { isLogged: boolean } {
  return {
    ...call,
    isLogged: hasLoggedCallActivity(call),
  };
}

export function addCallHistoryLoggedContact<T extends CallWithContactMatches>(
  call: T
): T & {
  callSelectionInfo?: {
    displayedSelection: CallContactMatch;
    selections: CallContactMatch[];
  };
} {
  const contactMatches =
    call.direction === "Inbound" ? call.fromMatches : call.toMatches;
  const loggedContact = getLoggedContact(call.activityMatches, contactMatches);
  if (!loggedContact) {
    return call;
  }
  return {
    ...call,
    callSelectionInfo: {
      displayedSelection: loggedContact,
      selections: [loggedContact],
    },
  };
}

interface CreateCallHistoryLogActionsOptions {
  call: CallWithActivityMatches;
  editLogLabel: string;
  hideEditLogButton: boolean;
  isLogging: boolean;
  logCallLabel: string;
  logButtonTitle?: string | null;
  ready: boolean;
  viewLogLabel: string;
}

export type CallHistoryLogActionHiddenReason = "callLoggerNotReady" | "faxCall";

interface LogCallFromHistoryOptions {
  actionType: "createLog" | "viewLog";
  call: HistoryCall;
  callLogger: Pick<CallLogger, "logCall">;
  info: {
    renderInfo: {
      matchedContact?: Parameters<CallLogger["logCall"]>[0]["contact"];
    };
  };
  router: Pick<RouterPlugin, "push">;
  thirdParty: Pick<ThirdParty, "showLogModal">;
}

function isActivityMatch(value: unknown): value is ActivityMatch {
  return Boolean(value && typeof value === "object");
}

export function hasLoggedCallActivity(call: CallWithActivityMatches): boolean {
  return Boolean(
    call.activityMatches?.some(
      (activity) => isActivityMatch(activity) && activity.type !== "status"
    )
  );
}

function hasPendingCallActivity(call: CallWithActivityMatches): boolean {
  return Boolean(
    call.activityMatches?.some(
      (activity) =>
        isActivityMatch(activity) &&
        activity.type === "status" &&
        activity.status === "pending"
    )
  );
}

export function createCallHistoryLogActions({
  call,
  editLogLabel,
  hideEditLogButton,
  isLogging,
  logCallLabel,
  logButtonTitle,
  ready,
  viewLogLabel,
}: CreateCallHistoryLogActionsOptions): HistoryAction[] {
  const isLogged = hasLoggedCallActivity(call);
  if (
    getCallHistoryLogActionHiddenReason({
      call,
      ready,
    })
  ) {
    return [];
  }
  const actions: HistoryAction[] = [];
  if (!isLogged || !hideEditLogButton) {
    actions.push({
      type: "createLog",
      label: isLogged ? editLogLabel : logButtonTitle || logCallLabel,
      disabled: isLogging || hasPendingCallActivity(call),
    });
  }
  if (isLogged) {
    actions.push({
      type: "viewLog",
      label: viewLogLabel,
      disabled: isLogging,
    });
  }
  return actions;
}

export function getCallHistoryLogActionHiddenReason({
  call,
  ready,
}: Pick<
  CreateCallHistoryLogActionsOptions,
  "call" | "ready"
>): CallHistoryLogActionHiddenReason | null {
  if (!ready) {
    return "callLoggerNotReady";
  }
  if (call.type === "Fax") {
    return "faxCall";
  }
  return null;
}

export function insertCallHistoryLogActions(
  actions: HistoryAction[],
  logActions: HistoryAction[]
): HistoryAction[] {
  const actionsWithoutLog = actions.filter(
    ({ type }) => type !== "viewLog" && type !== "createLog"
  );
  const createOrEditAction = logActions.find(
    ({ type }) => type === "createLog"
  );
  const viewAction = logActions.find(({ type }) => type === "viewLog");
  return [
    ...(createOrEditAction ? [createOrEditAction] : []),
    ...actionsWithoutLog,
    ...(viewAction ? [viewAction] : []),
  ];
}

export async function logCallFromHistory({
  actionType,
  call,
  callLogger,
  info,
  router,
  thirdParty,
}: LogCallFromHistoryOptions): Promise<void> {
  if (thirdParty.showLogModal && actionType !== "viewLog") {
    await router.push(`/log/call/${call.sessionId}`);
    return;
  }
  await callLogger.logCall({
    call,
    contact: info.renderInfo.matchedContact,
    redirect: true,
    triggerType:
      actionType === "viewLog"
        ? "viewLog"
        : hasLoggedCallActivity(call)
        ? "editLog"
        : "createLog",
  });
}
