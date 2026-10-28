import type { FunctionComponent } from 'react';
import React from 'react';
import { Button, Drawer } from '@ringcentral/spring-ui';
import type { ButtonProps } from '@ringcentral/spring-ui';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';

import type {
  EndCallDrawerProps,
  EndCallOptionAppearance,
} from './EndCallDrawer.interface';
import i18n from './i18n';

const BUTTON_PROPS: Record<
  EndCallOptionAppearance,
  Pick<ButtonProps, 'variant' | 'color'>
> = {
  primary: { variant: 'contained', color: 'danger' },
  danger: { variant: 'outlined', color: 'danger' },
  neutral: { variant: 'outlined', color: 'neutral' },
};

/**
 * EndCallDrawer - Asks which parties to drop before ending a multi-party call
 *
 * A bottom drawer with one button per way to end the call; a click ends the
 * call that way. Purely presentational: the caller supplies the available
 * options and decides what each one does.
 *
 * Like DialpadPanel, the drawer renders in place, so the host must establish a
 * containing block for fixed-position descendants (e.g. `[contain:layout]`) to
 * keep it out of the expanded side column.
 */
export const EndCallDrawer: FunctionComponent<EndCallDrawerProps> = ({
  open,
  options,
  onClose,
  onConfirm,
}) => {
  const { t } = useLocale(i18n);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      disablePortal
      // The buttons say what they do, so the drawer goes without a visible
      // title; the dialog still needs a name for screen readers.
      bodyProps={{ 'aria-label': t('endCall') }}
      data-sign="endCallDrawer"
    >
      <div className="flex flex-col gap-2 px-4 pt-2 pb-4">
        {options.map(({ id, label, description, appearance }) => (
          <Button
            key={id}
            {...BUTTON_PROPS[appearance]}
            size="large"
            fullWidth
            onClick={() => onConfirm(id)}
            data-sign={`endCallOption-${id}`}
          >
            {/* The button truncates its content, so a long transfer
                destination is cut at its end and the label stays whole */}
            {description ? `${label} ${description}` : label}
          </Button>
        ))}
        <Button
          variant="text"
          color="neutral"
          size="large"
          fullWidth
          onClick={onClose}
          data-sign="endCallCancel"
        >
          {t('cancel')}
        </Button>
      </div>
    </Drawer>
  );
};
