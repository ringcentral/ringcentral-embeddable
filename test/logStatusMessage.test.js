import { render, screen } from "@testing-library/react";
import React from "react";

import { LogStatusMessage } from "../src/app/components/LogStatusMessage";

describe("LogStatusMessage", () => {
  test.each([
    ["pending", "text-warning-f"],
    ["failed", "text-danger-f"],
    ["success", "text-success-f"],
    ["unknown", "text-neutral-b2"],
  ])("maps %s to the matching Spring color token", (status, colorClass) => {
    render(
      <LogStatusMessage
        matches={[{ message: "Logger status", status, type: "status" }]}
      />
    );

    expect(screen.getByTestId("logStatusMessage")).toHaveClass(colorClass);
    expect(screen.getByTestId("logStatusMessage")).toHaveAttribute(
      "title",
      "Logger status"
    );
  });

  test("ignores non-status matches and empty messages", () => {
    const { container, rerender } = render(
      <LogStatusMessage
        matches={[{ message: "CRM activity", type: "messageLog" }]}
      />
    );

    expect(container).toBeEmptyDOMElement();

    rerender(
      <LogStatusMessage
        matches={[{ message: "   ", status: "pending", type: "status" }]}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
