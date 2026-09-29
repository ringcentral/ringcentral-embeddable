import React, { useCallback, useEffect, useRef } from 'react';
import type { FunctionComponent } from 'react';
import { DialPad, DialTextField, IconButton, Drawer } from '@ringcentral/spring-ui';
import { Xmd } from '@ringcentral/spring-icon';

import type { DialpadPanelProps } from './DialpadPanel.interface';

/**
 * DialpadPanel - Pure Drawer-based keypad overlay.
 * Opens as a bottom Drawer with close button, dial text field, and dial pad.
 */
export const DialpadPanel: FunctionComponent<DialpadPanelProps> = ({
  isOpen,
  value,
  onToggle,
  onChange,
  onKeyPress,
  footer,
  className,
  'data-sign': dataSign = 'dialpadPanel',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const handleDialPadChange = useCallback(
    (digit: string) => {
      onChange(value + digit);
    },
    [onChange, value],
  );

  const handleTextFieldChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    [onChange],
  );

  const handleClose = useCallback(() => {
    onToggle(false);
  }, [onToggle]);

  return (
    <Drawer
      anchor="bottom"
      open={isOpen}
      onClose={handleClose}
      footer={footer}
      className={className}
      data-sign={dataSign}
    >
      <div className="flex justify-end pt-2 pr-2">
        <IconButton
          symbol={Xmd}
          size="small"
          variant="icon"
          color="neutral"
          onClick={handleClose}
          data-sign="keypadCloseButton"
        />
      </div>
      <div className="px-4">
        <DialTextField
          inputRef={inputRef}
          value={value}
          onChange={handleTextFieldChange}
          keypadMode
          onlyAllowKeypadValue
          fullWidth
          data-sign="keypadTextField"
        />
      </div>
      <div className="flex justify-center px-4 py-2">
        <DialPad
          onChange={handleDialPadChange}
          size="medium"
          data-sign="keypadDialPad"
        />
      </div>
    </Drawer>
  );
};
