const {
  Analytics: AnalyticsBase,
} = require("@ringcentral-integration/micro-auth/src/app/services");
const {
  EmbeddableAnalytics,
} = require("../src/app/services/Analytics/Analytics");
const {
  formatExternalAnalyticsEvent,
} = require("../src/app/services/Analytics/formatExternalAnalyticsEvent");
const {
  getAnalyticsOptions,
} = require("../src/app/services/Analytics/getAnalyticsOptions");

describe("external analytics compatibility", () => {
  test("maps the runtime flag to the analytics DI option", () => {
    expect(
      getAnalyticsOptions({
        appName: "Embeddable",
        appVersion: "1.0.0",
        analyticsKey: "",
        enableAnalytics: true,
      })
    ).toEqual({
      appName: "Embeddable",
      appVersion: "1.0.0",
      analyticsKey: "",
      enableExternalAnalytics: true,
    });
  });

  describe("legacy event formatting", () => {
    test.each([
      [
        "Call Control: Mute/Call notification page",
        "Call interaction",
        {
          source: "button",
          callInteractionName: "Mute",
          callInteractionLocation: "Call notification page",
        },
      ],
      [
        "Transfer (All Calls)",
        "Call interaction",
        {
          source: "button",
          callInteractionName: "Transfer",
          callInteractionLocation: "All calls page",
        },
      ],
      [
        "Hold (Call Control)",
        "Call interaction",
        {
          source: "button",
          callInteractionName: "Hold",
          callInteractionLocation: "Call control page",
        },
      ],
      [
        "Click To Dial (Message list)",
        "Click To dial",
        { source: "button", interactionLocation: "Message list" },
      ],
      [
        "Click To SMS (Contact details)",
        "Click to SMS",
        { source: "button", interactionLocation: "Contact details" },
      ],
    ])("formats %s", (event, formattedEvent, formattedProperties) => {
      expect(formatExternalAnalyticsEvent(event, { source: "button" })).toEqual(
        {
          event: formattedEvent,
          properties: formattedProperties,
        }
      );
    });

    test.each([
      "WebRTC registration",
      "Meeting: Click Schedule/Meeting schedule page",
      "Call: Outbound RingOut Call connected",
    ])("filters %s", (event) => {
      expect(formatExternalAnalyticsEvent(event)).toBeNull();
    });
  });

  describe("host postMessage boundary", () => {
    let baseTrack;
    let baseTrackOnMainTab;
    let postMessage;

    beforeEach(() => {
      baseTrack = jest
        .spyOn(AnalyticsBase.prototype, "track")
        .mockResolvedValue(undefined);
      baseTrackOnMainTab = jest
        .spyOn(AnalyticsBase.prototype, "trackOnMainTab")
        .mockResolvedValue(undefined);
      postMessage = jest
        .spyOn(window, "postMessage")
        .mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    function createAnalytics(enableExternalAnalytics) {
      return new EmbeddableAnalytics(
        {},
        {},
        {},
        {},
        {
          analyticsKey: "",
          appVersion: "1.0.0",
          enableExternalAnalytics,
        }
      );
    }

    test("posts the exact legacy envelope before upstream analytics", async () => {
      const analytics = createAnalytics(true);

      await analytics.track("Call Control: Mute/Call control page", {
        source: "button",
      });

      expect(postMessage).toHaveBeenCalledWith(
        {
          type: "rc-analytics-track",
          event: "Call interaction",
          properties: {
            source: "button",
            callInteractionName: "Mute",
            callInteractionLocation: "Call control page",
          },
        },
        "*"
      );
      expect(baseTrack).toHaveBeenCalledWith("Call interaction", {
        source: "button",
        callInteractionName: "Mute",
        callInteractionLocation: "Call control page",
      });
    });

    test("does not post when disabled but keeps upstream tracking", async () => {
      const analytics = createAnalytics(false);

      await analytics.track("Custom event", { source: "button" });

      expect(postMessage).not.toHaveBeenCalled();
      expect(baseTrack).toHaveBeenCalledWith("Custom event", {
        source: "button",
      });
    });

    test("drops legacy-filtered events from both transports", async () => {
      const analytics = createAnalytics(true);

      await analytics.track("WebRTC registration");

      expect(postMessage).not.toHaveBeenCalled();
      expect(baseTrack).not.toHaveBeenCalled();
    });

    test("does not expose next-only route tracking events to the host", async () => {
      const analytics = createAnalytics(true);

      await analytics.track("Navigation: Click/Calls", { router: "/calls" });

      expect(postMessage).not.toHaveBeenCalled();
      expect(baseTrack).toHaveBeenCalledWith("Navigation: Click/Calls", {
        router: "/calls",
      });
    });

    test("posts once when delegated tracking reaches the main client", async () => {
      const analytics = createAnalytics(true);

      await analytics.trackOnMainTab("Custom event", { source: "worker" });

      expect(postMessage).toHaveBeenCalledTimes(1);
      expect(postMessage).toHaveBeenCalledWith(
        {
          type: "rc-analytics-track",
          event: "Custom event",
          properties: { source: "worker" },
        },
        "*"
      );
      expect(baseTrackOnMainTab).toHaveBeenCalledWith("Custom event", {
        source: "worker",
      });
    });
  });
});
