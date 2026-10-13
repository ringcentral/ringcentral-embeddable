import type { LegacyNavigationIntent } from "./LegacyNavigationIntent";

const DIRECT_ROUTE_PATTERNS: readonly RegExp[] = [
  /^\/$/,
  /^\/composeFax$/,
  /^\/faxes\/[^/]+$/,
  /^\/composeText$/,
  /^\/contacts$/,
  /^\/contacts\/[^/]+\/[^/]+$/,
  /^\/conversations\/[^/]+$/,
  /^\/customized\/[^/]+$/,
  /^\/customizedTabs\/[^/]+$/,
  /^\/fax$/,
  /^\/meeting$/,
  /^\/meeting\/personalMeetingSettings$/,
  /^\/meeting\/schedule$/,
  /^\/log\/call\/[^/]+$/,
  /^\/log\/messages\/[^/]+$/,
  /^\/messages$/,
  /^\/settings$/,
  /^\/settings\/(?:applicationLogs|audio|autoCallLogSettings(?:\/(?:callLogging|recordMatching))?|calling|callQueueManagement|phoneNumberFormat|region|text|theme|voicemailDrop)$/,
  /^\/voicemails\/[^/]+$/,
  /^\/welcome$/,
];

function isDirectRoute(path: string): boolean {
  return DIRECT_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}

/** Classifies a legacy host navigation path before any router side effect. */
export function resolveLegacyAdapterPath(path: string): LegacyNavigationIntent {
  if (path === "goBack") {
    return { kind: "back" };
  }
  const historyMatch = path.match(/^\/history(?:\/([^/]+))?$/);
  if (historyMatch) {
    const historyType = historyMatch[1] ?? "all";
    if (historyType === "all") {
      return { kind: "dialerTab", tab: "calls" };
    }
    return {
      kind: "unsupported",
      path,
      reason: `Legacy call-history type "${historyType}" is not migrated`,
    };
  }
  const activeCallMatch = path.match(/^\/calls\/active(?:\/([^/]+))?$/);
  if (activeCallMatch) {
    return {
      kind: "activeCall",
      ...(activeCallMatch[1] ? { webphoneSessionId: activeCallMatch[1] } : {}),
    };
  }
  if (path === "/calling") {
    return { kind: "activeCall" };
  }
  if (path === "/calls") {
    return { kind: "activeCallList" };
  }
  if (path === "/dialer") {
    return { kind: "dialerTab", tab: "keypad" };
  }
  if (path === "/messages/voicemail") {
    return { kind: "dialerTab", tab: "voicemail" };
  }
  if (path === "/meeting/home") {
    return { kind: "meetingTab", tab: "upcoming" };
  }
  if (path === "/meeting/history") {
    return { kind: "meetingTab", tab: "history" };
  }
  if (path === "/meeting/history/recordings") {
    return { kind: "meetingTab", tab: "recordings" };
  }
  if (isDirectRoute(path)) {
    return { kind: "route", path };
  }
  return {
    kind: "unsupported",
    path,
    reason: "No compatible next route is available",
  };
}
