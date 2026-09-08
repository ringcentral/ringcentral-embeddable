import { InfoMd } from "@ringcentral/spring-icon";
import { IconButton, Tooltip } from "@ringcentral/spring-ui";
import React from "react";

interface CallerIdInfoButtonProps {
  callerId?: string;
  dataSign: string;
  title: string;
}

export function CallerIdInfoButton({
  callerId,
  dataSign,
  title,
}: CallerIdInfoButtonProps): React.ReactElement | null {
  if (!callerId?.trim()) {
    return null;
  }
  return (
    <Tooltip color="neutral" placement="bottom" title={title}>
      <IconButton
        aria-label={title}
        color="neutral"
        data-sign={dataSign}
        size="small"
        symbol={InfoMd}
        variant="icon"
      />
    </Tooltip>
  );
}
