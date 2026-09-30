import type { TrackRouter } from "@ringcentral-integration/micro-auth/src/app/services/Analytics/Analytics.interface";

/**
 * Legacy Embeddable analytics constants. Keep these values unchanged so the
 * Mixpanel identities, event names and page names match the legacy app.
 */
export const LEGACY_ANALYTICS = {
  appName: "RingCentral Embeddable",
  pageViewEvent: "Viewed page",
  accountGroupKey: "rcAccountId",
  navigationClickPrefix: "Navigation: Click/",
  navigationLingerPrefix: "Navigation: Linger/",
  sandboxServerKeyword: "devtest",
  secondLevelRoutes: [
    "calls",
    "settings",
    "conferenceCall",
    "meeting",
    "glip",
    "contacts",
    "log",
    "history",
    "messages",
  ],
} as const;

/**
 * Legacy route list: commons AnalyticsV2 routes without `/conferenceCall`,
 * followed by the Embeddable routes. The first match wins, like legacy `find`.
 */
const LEGACY_TRACK_ROUTER_LIST: readonly TrackRouter[] = [
  { eventPostfix: "Dialer", router: "/dialer" },
  { eventPostfix: "Compose SMS", router: "/composeText" },
  { eventPostfix: "Messages", router: "/messages" },
  { eventPostfix: "Conversation", router: "/conversations" },
  { eventPostfix: "Call History", router: "/history" },
  { eventPostfix: "All calls page", router: "/calls" },
  { eventPostfix: "Settings", router: "/settings" },
  { eventPostfix: "Meeting", router: "/meeting" },
  { eventPostfix: "Contacts", router: "/contacts" },
  { eventPostfix: "Call Control", router: "/calls/active" },
  { eventPostfix: "Transfer", router: "/transfer" },
  { eventPostfix: "Small call control", router: "/simplifycallctrl" },
  { eventPostfix: "Flip", router: "/flip" },
  { eventPostfix: "Glip", router: "/glip" },
  { eventPostfix: "Glip Conversation", router: "/glip/groups" },
  { eventPostfix: "Meeting Home", router: "/meeting/home" },
  { eventPostfix: "Meeting History", router: "/meeting/history" },
  { eventPostfix: "Meeting Schedule", router: "/meeting/schedule" },
  { eventPostfix: "Calling Settings", router: "/settings/calling" },
  { eventPostfix: "Region Settings", router: "/settings/region" },
  { eventPostfix: "Audio Settings", router: "/settings/audio" },
  { eventPostfix: "Ringtone Settings", router: "/settings/ringtone" },
  {
    eventPostfix: "Call queue presence",
    router: "/settings/callQueuePresence",
  },
  { eventPostfix: "Conference Dialer", router: "/conferenceCall/dialer" },
  {
    eventPostfix: "Conference Participants",
    router: "/conferenceCall/participants",
  },
  { eventPostfix: "Conference OnHold", router: "/conferenceCall/onHold" },
  { eventPostfix: "Contact Details", router: "/contacts/details" },
  { eventPostfix: "Log Call", router: "/log/call" },
  { eventPostfix: "Log Messages", router: "/log/messages" },
  { eventPostfix: "Recordings", router: "/history/recordings" },
  { eventPostfix: "Customized Page", router: "/customized" },
  { eventPostfix: "Voicemail", router: "/messages/voicemail" },
  { eventPostfix: "Fax", router: "/messages/fax" },
  { eventPostfix: "Customized Tab", router: "/customizedTabs" },
];

/**
 * Legacy track routers keyed by route, keeping the first entry per route.
 */
export const LEGACY_TRACK_ROUTERS_MAP = LEGACY_TRACK_ROUTER_LIST.reduce(
  (routers, trackRouter) =>
    routers.has(trackRouter.router)
      ? routers
      : routers.set(trackRouter.router, trackRouter),
  new Map<string, TrackRouter>()
);
