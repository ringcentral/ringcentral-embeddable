import React, { useEffect, useRef, type FunctionComponent } from 'react';
import {
  DialTextField,
  DialDelete,
  DialPad,
  DialerPadSoundsMPEG,
  IconButton,
  ListItem,
  ListItemText,
} from '@ringcentral/spring-ui';
import { BackspaceMd } from '@ringcentral/spring-icon';

import {
  formatDirectoryRecordName,
  type DirectoryRecord,
} from '../../services/CxDirectorySearch';

interface ManualEntryTransferTabProps {
  isActive: boolean;
  value: string;
  directoryRecords: DirectoryRecord[];
  selectedDirectoryRecordId: string | null;
  matchedDirectoryName: string;
  isSearchingDirectory: boolean;
  showKeypad: boolean;
  onChange: (value: string) => void;
  onKeypadPress: (key: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSelectDirectoryRecord: (record: DirectoryRecord) => void;
  labels: {
    enterNumber: string;
    searchingDirectory: string;
    corporateDirectory: string;
    extension: (extensionNumber: string) => string;
  };
}

/**
 * Manual entry transfer tab: number field, inline keypad and corporate
 * directory results, mirroring the dial page.
 */
export const ManualEntryTransferTab: FunctionComponent<ManualEntryTransferTabProps> = ({
  isActive,
  value,
  directoryRecords,
  selectedDirectoryRecordId,
  matchedDirectoryName,
  isSearchingDirectory,
  showKeypad,
  onChange,
  onKeypadPress,
  onBackspace,
  onClear,
  onSelectDirectoryRecord,
  labels,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

  const hasValue = value.trim().length > 0;

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      data-sign="manualEntryTransferTab"
    >
      <div className="flex-shrink-0 [&_input]:text-center">
        <DialTextField
          data-sign="transferNumberField"
          value={value}
          onChange={onChange}
          placeholder={labels.enterNumber}
          fullWidth
          // no `onlyAllowKeypadValue`: letters are needed to search the
          // corporate directory by name
          inputRef={inputRef}
          endAdornment={
            hasValue ? (
              <DialDelete onDelete={onBackspace} onClear={onClear}>
                <IconButton
                  symbol={BackspaceMd}
                  variant="icon"
                  size="small"
                  color="neutral"
                  data-sign="deleteButton"
                />
              </DialDelete>
            ) : undefined
          }
        />
      </div>
      {showKeypad ? (
        <>
          {/* Reserved whether or not there is anything to say. The keypad below
              takes the remaining height, so rendering this row conditionally
              would resize the pad the moment the status appears.
              A matched member's name takes precedence over the progress text:
              it is the answer the search was running for, and it is the only
              place a keypad-entered extension is identified, since numeric
              input never opens the result list. */}
          <div className="h-4 flex-shrink-0 text-center leading-4">
            {hasValue && (matchedDirectoryName || isSearchingDirectory) && (
              <span
                className="typography-descriptor text-neutral-b2"
                data-sign="transferDirectoryStatus"
              >
                {matchedDirectoryName || labels.searchingDirectory}
              </span>
            )}
          </div>
          {/* Keypad block, as on the dial page: a fixed `size="medium"` pad
              (200x248, 56px keys) whose `gap-y-2` replaces the pad's default
              percentage `gap` -- a percentage row-gap resolves against the
              pad's own height, so it only stays self-consistent while nothing
              constrains that height.
              Two things this panel needs beyond the dial page's version:
              - `min-h-0 overflow-y-auto`, because the transfer panel body is
                far shorter: the pad scrolls rather than pushing the Stay on
                call switch and the Cancel/Transfer buttons out of the frame.
              - no `<Dialer>` wrapper, and an explicit `onChange`. That context
                auto-inserts keys into the DialTextField, which would route
                keypad presses through `onChange` and trigger a directory
                search. Keeping the two input paths separate is what makes
                keypad input skip the search. */}
          <div
            className="flex flex-col items-center flex-auto min-h-0 overflow-y-auto pb-2"
            data-sign="transferKeypad"
          >
            <DialPad
              size="medium"
              className="gap-y-2"
              onChange={onKeypadPress}
              sounds={DialerPadSoundsMPEG}
              data-sign="transferDialPad"
            />
          </div>
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto mt-2">
          <div
            className="typography-label uppercase text-neutral-b3 pt-3 pb-1"
            data-sign="transferCorporateDirectoryHeader"
          >
            {labels.corporateDirectory}
          </div>
          {directoryRecords.map((record) => (
            <ListItem
              key={record.id}
              size="large"
              // Clicking only marks the destination; the footer Transfer button
              // is what issues the transfer
              selected={record.id === selectedDirectoryRecordId}
              onClick={() => onSelectDirectoryRecord(record)}
              data-sign="transferDirectoryRecord"
            >
              <ListItemText
                primary={formatDirectoryRecordName(record)}
                secondary={labels.extension(record.extensionNumber)}
              />
            </ListItem>
          ))}
        </div>
      )}
    </div>
  );
};
