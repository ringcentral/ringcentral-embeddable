import React from "react";

interface LogStatusMessageProps {
  readonly className?: string;
  readonly matches?: readonly unknown[];
  readonly multiline?: boolean;
}

interface LogStatusMatch {
  readonly message: string;
  readonly status?: string;
  readonly type: "status";
}

function isLogStatusMatch(match: unknown): match is LogStatusMatch {
  if (!match || typeof match !== "object") {
    return false;
  }
  const candidate = match as Partial<LogStatusMatch>;
  return candidate.type === "status" && typeof candidate.message === "string";
}

function getStatusColorClassName(status?: string): string {
  switch (status) {
    case "pending":
      return "text-warning-f";
    case "failed":
      return "text-danger-f";
    case "success":
      return "text-success-f";
    default:
      return "text-neutral-b2";
  }
}

/** Displays a third-party logger status message using Spring semantic tokens. */
export function LogStatusMessage({
  className = "",
  matches,
  multiline = false,
}: LogStatusMessageProps): React.ReactElement | null {
  const statusMatch = matches?.find(isLogStatusMatch);
  const message = statusMatch?.message.trim();
  if (!message) {
    return null;
  }
  const classes = [
    "typography-descriptor min-w-0 max-w-full",
    multiline ? "whitespace-normal break-words" : "truncate",
    getStatusColorClassName(statusMatch.status),
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={classes} data-sign="logStatusMessage" title={message}>
      {message}
    </span>
  );
}
