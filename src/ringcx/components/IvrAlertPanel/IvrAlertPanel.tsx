import { Accordion, AccordionHeader } from '@ringcentral/spring-ui';
import clsx from 'clsx';
import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';

import type { IvrAlertPanelProps } from './IvrAlertPanel.interface';

/**
 * IvrAlertPanel - Expandable accordion displaying IVR alert data
 *
 * Shows a summary with the first alert subject and a count badge for
 * additional alerts. Expands to show all alert subjects and bodies.
 */
export const IvrAlertPanel: FunctionComponent<IvrAlertPanelProps> = ({
  ivrAlertData,
  isCallEnd = false,
  className,
  'data-sign': dataSign = 'ivrAlertPanel',
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isCallEnd) {
      setExpanded(false);
    }
  }, [isCallEnd]);

  if (!ivrAlertData || ivrAlertData.length === 0) {
    return null;
  }

  const firstAlert = ivrAlertData[0];
  const additionalCount = ivrAlertData.length - 1;

  const headerContent = (
    <div className="flex items-center gap-2 min-w-0">
      <span className="typography-subtitleMini text-neutral-b1 truncate">
        {firstAlert.subject || firstAlert.body || ''}
      </span>
      {additionalCount > 0 && (
        <span
          className="typography-descriptorMini text-neutral-b3 flex-shrink-0"
          data-sign="ivrAlertCount"
        >
          +{additionalCount}
        </span>
      )}
    </div>
  );

  return (
    <div
      className={clsx('border-b border-neutral-b4', className)}
      data-sign={dataSign}
    >
      <Accordion
        expanded={expanded}
        onChange={(_event, isExpanded) => setExpanded(isExpanded)}
        header={
          <AccordionHeader>
            {headerContent}
          </AccordionHeader>
        }
      >
        <div className="px-4 pb-3 space-y-3">
          {ivrAlertData.map(({ subject, body }, index) => (
            <div key={index} data-sign={`ivrAlertItem-${index}`}>
              {/* Show subject for items after the first (first is in header) */}
              {index !== 0 && subject && (
                <div className="typography-subtitleMini text-neutral-b1 mb-1">
                  {subject}
                </div>
              )}
              {/* Show first item's subject in expanded body too */}
              {index === 0 && subject && (
                <div className="typography-subtitleMini text-neutral-b1 mb-1">
                  {subject}
                </div>
              )}
              {body && (
                <div className="typography-descriptor text-neutral-b2 whitespace-pre-wrap break-words">
                  {body}
                </div>
              )}
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  );
};
