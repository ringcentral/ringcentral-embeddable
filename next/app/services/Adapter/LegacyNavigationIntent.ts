export type LegacyNavigationIntent =
  | { readonly kind: "back" }
  | { readonly kind: "activeCall"; readonly webphoneSessionId?: string }
  | { readonly kind: "activeCallList" }
  | {
      readonly kind: "dialerTab";
      readonly tab: "keypad" | "calls" | "voicemail";
    }
  | {
      readonly kind: "meetingTab";
      readonly tab: "upcoming" | "history" | "recordings";
    }
  | { readonly kind: "route"; readonly path: string }
  | {
      readonly kind: "unsupported";
      readonly path: string;
      readonly reason: string;
    };
