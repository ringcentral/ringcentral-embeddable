import type {
  CallLogger,
  HistoryCall,
} from "@ringcentral-integration/micro-phone/src/app/services";
import type { RouterPlugin } from "@ringcentral-integration/next-core";
import type { HistoryAction } from "@ringcentral-integration/next-widgets/components/ActionMenuList/useHistoryActionButtons";

import type { ThirdParty } from "../../services/ThirdParty";

type ActivityMatch = {
  status?: string;
  type?: string;
};

type CallWithActivityMatches = Pick<HistoryCall, "type"> & {
  activityMatches?: Array<ActivityMatch | string>;
};

export function addCallHistoryLogStatus<T extends CallWithActivityMatches>(
  call: T
): T & { isLogged: boolean } {
  return {
    ...call,
    isLogged: hasLoggedCallActivity(call),
  };
}

interface CreateCallHistoryLogActionOptions {
  call: CallWithActivityMatches;
  editLogLabel: string;
  hideEditLogButton: boolean;
  isLogging: boolean;
  logCallLabel: string;
  logButtonTitle?: string | null;
  ready: boolean;
}

export type CallHistoryLogActionHiddenReason =
  | "callLoggerNotReady"
  | "editLogHidden"
  | "faxCall";

interface LogCallFromHistoryOptions {
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

export function createCallHistoryLogAction({
  call,
  editLogLabel,
  hideEditLogButton,
  isLogging,
  logCallLabel,
  logButtonTitle,
  ready,
}: CreateCallHistoryLogActionOptions): HistoryAction | null {
  const isLogged = hasLoggedCallActivity(call);
  if (
    getCallHistoryLogActionHiddenReason({
      call,
      hideEditLogButton,
      ready,
    })
  ) {
    return null;
  }
  return {
    type: "viewLog",
    label: isLogged ? editLogLabel : logButtonTitle || logCallLabel,
    disabled: isLogging || hasPendingCallActivity(call),
  };
}

export function getCallHistoryLogActionHiddenReason({
  call,
  hideEditLogButton,
  ready,
}: Pick<
  CreateCallHistoryLogActionOptions,
  "call" | "hideEditLogButton" | "ready"
>): CallHistoryLogActionHiddenReason | null {
  if (!ready) {
    return "callLoggerNotReady";
  }
  if (call.type === "Fax") {
    return "faxCall";
  }
  if (hasLoggedCallActivity(call) && hideEditLogButton) {
    return "editLogHidden";
  }
  return null;
}

export function insertCallHistoryLogAction(
  actions: HistoryAction[],
  logAction: HistoryAction | null
): HistoryAction[] {
  const actionsWithoutLog = actions.filter(
    ({ type }) => type !== "viewLog" && type !== "createLog"
  );
  return logAction ? [logAction, ...actionsWithoutLog] : actionsWithoutLog;
}

export async function logCallFromHistory({
  call,
  callLogger,
  info,
  router,
  thirdParty,
}: LogCallFromHistoryOptions): Promise<void> {
  if (thirdParty.showLogModal) {
    await router.push(`/log/call/${call.sessionId}`);
    return;
  }
  await callLogger.logCall({
    call,
    contact: info.renderInfo.matchedContact,
    redirect: true,
    triggerType: hasLoggedCallActivity(call) ? "editLog" : "createLog",
  });
}
