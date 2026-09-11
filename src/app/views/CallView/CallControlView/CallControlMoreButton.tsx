import { FormattedPhoneNumber } from '@ringcentral-integration/micro-auth/src/app/components';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { CallControlViewPanelProps } from '@ringcentral-integration/micro-phone/src/app/views/CallView/routes/CallControlViewSpring';
import { OverflowMd } from '@ringcentral/spring-icon';
import {
  Icon,
  IconButton,
  type IconButtonProps,
  Menu,
  MenuItem,
  MenuItemText,
  MenuList,
  SubMenu,
} from '@ringcentral/spring-ui';
import React, { type FC, useCallback, useState } from 'react';

import i18n from './i18n';

export type CallControlMoreAction = IconButtonProps & {
  actionType: string;
  label?: string;
  tooltip?: string;
};

interface CallControlMoreButtonProps
  extends Pick<CallControlViewPanelProps, 'flipNumbers' | 'onAction'> {
  actions: CallControlMoreAction[];
}

/**
 * the call control grid only fits a limited number of buttons, the remaining
 * actions are shown in that menu, next to the end call button
 */
export const CallControlMoreButton: FC<CallControlMoreButtonProps> = ({
  actions,
  flipNumbers,
  onAction,
}) => {
  const { t } = useLocale(i18n);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const menuOpen = Boolean(anchorEl);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton
        size="medium"
        color="secondary"
        variant="outlined"
        symbol={OverflowMd}
        data-sign="more"
        TooltipProps={{ title: t('moreCallActions') }}
        onClick={(event) => {
          setAnchorEl(event.currentTarget);
        }}
      />
      <Menu
        open={menuOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        data-sign="moreActionList"
      >
        <MenuList nowrap={false}>
          {actions.map(({ actionType, label, symbol, disabled, onClick }) => {
            // the flip action needs the flip number to run, so it opens the
            // same number list the in grid button shows
            if (actionType === 'flip') {
              return (
                <SubMenu
                  key={actionType}
                  data-sign={actionType}
                  disabled={disabled}
                  itemContent={
                    <>
                      <Icon size="small" symbol={symbol} />
                      <MenuItemText>{label}</MenuItemText>
                    </>
                  }
                >
                  {flipNumbers.map((item, index) => (
                    <MenuItem
                      key={index}
                      onClick={() => {
                        handleClose();
                        onAction('flip', item.flipNumber);
                      }}
                    >
                      <MenuItemText>
                        <div className="text-neutral-b1">{item.label}</div>
                        <div className="text-neutral-b2">
                          <FormattedPhoneNumber
                            phoneNumber={item.phoneNumber}
                          />
                        </div>
                      </MenuItemText>
                    </MenuItem>
                  ))}
                </SubMenu>
              );
            }
            return (
              <MenuItem
                key={actionType}
                data-sign={actionType}
                disabled={disabled}
                onClick={(event) => {
                  handleClose();
                  onClick?.(event as never);
                }}
              >
                <Icon size="small" symbol={symbol} />
                <MenuItemText>{label}</MenuItemText>
              </MenuItem>
            );
          })}
        </MenuList>
      </Menu>
    </>
  );
};
