const FILTERED_EVENTS = new Set([
  "WebRTC registration",
  "Meeting: Click Schedule/Meeting schedule page",
  "Call: Outbound RingOut Call connected",
]);

type ExternalAnalyticsEvent = {
  event: string;
  properties: Record<string, unknown>;
};

/**
 * Preserves the event-name and property normalization used by the legacy
 * Embeddable analytics bridge.
 */
export function formatExternalAnalyticsEvent(
  event: string,
  properties: Readonly<Record<string, unknown>> = {}
): ExternalAnalyticsEvent | null {
  if (FILTERED_EVENTS.has(event)) {
    return null;
  }

  let formattedEvent = event;
  let formattedProperties = { ...properties };

  if (event.includes("Call Control:")) {
    formattedEvent = "Call interaction";
    let callInteractionName = event.replace("Call Control: ", "");
    let callInteractionLocation = "Call control page";
    if (callInteractionName.includes("/")) {
      [callInteractionName, callInteractionLocation] =
        callInteractionName.split("/");
    }
    formattedProperties = {
      ...properties,
      callInteractionName,
      callInteractionLocation,
    };
  } else if (event.includes("(All Calls)")) {
    formattedEvent = "Call interaction";
    formattedProperties = {
      ...properties,
      callInteractionName: event.replace(" (All Calls)", ""),
      callInteractionLocation: "All calls page",
    };
  } else if (event.includes("(Call Control)")) {
    formattedEvent = "Call interaction";
    formattedProperties = {
      ...properties,
      callInteractionName: event.replace(" (Call Control)", ""),
      callInteractionLocation: "Call control page",
    };
  } else if (
    event.includes("Click To Dial") ||
    event.includes("Click To dial")
  ) {
    formattedEvent = "Click To dial";
    formattedProperties = {
      ...properties,
      interactionLocation: getInteractionLocation(event),
    };
  } else if (event.includes("Click To SMS")) {
    formattedEvent = "Click to SMS";
    formattedProperties = {
      ...properties,
      interactionLocation: getInteractionLocation(event),
    };
  }

  return {
    event: formattedEvent,
    properties: formattedProperties,
  };
}

function getInteractionLocation(event: string): string {
  const start = event.indexOf("(");
  const end = event.indexOf(")");
  if (start === -1 || end === -1 || end <= start) {
    return "";
  }
  return event.substring(start + 1, end);
}
