import type { FunctionComponent } from 'react';
import React, { memo, useMemo } from 'react';

import classNames from 'classnames';

import type { RcSnackbarContentType } from '@ringcentral/juno';
import {
  combineProps,
  RcSnackbarAction,
  RcSnackbarContent,
} from '@ringcentral/juno';
import { Close as closeSvg } from '@ringcentral/juno-icon';

import type {
  NotificationItemProps,
  NotificationMessage,
} from '@ringcentral-integration/widgets/components/NotificationPanel/NotificationPanel.interface';
import styles from '@ringcentral-integration/widgets/components/NotificationPanel/styles.scss';

export function getLevelType(level: NotificationMessage['level']) {
  let type: RcSnackbarContentType;
  switch (level) {
    case 'warning':
      type = 'warn';
      break;
    case 'danger':
      type = 'error';
      break;
    default:
      type = level;
  }
  return type;
}

export const NotificationItem: FunctionComponent<NotificationItemProps> = memo(
  ({
    data,
    currentLocale,
    brand,
    dismiss,
    getRenderer,
    duration = 0,
    animation: defaultAnimation,
    backdropAnimation: defaultBackdropAnimation,
    classes: {
      snackbar: snackbarClass = {},
      backdrop: backdropClass = undefined,
    } = {},
    size,
    messageAlign,
    fullWidth,
  }) => {
    const Message = getRenderer(data);
    const second = duration / 1000;
    const {
      id,
      level,
      classes = {},
      loading,
      action,
      animation = defaultAnimation,
      backdropAnimation = defaultBackdropAnimation,
      backdrop,
      onBackdropClick,
    } = data;

    const type: RcSnackbarContentType = getLevelType(level);

    const animationStyle = useMemo(
      () => ({
        animationDuration: `${second}s`,
      }),
      [second],
    );

    return (
      <div className={styles.container}>
        {backdrop && (
          <div
            className={classNames(
              styles.backdrop,
              backdropClass,
              classes.backdrop,
              'animated',
              backdropAnimation,
            )}
            style={animationStyle}
            onClick={onBackdropClick}
          />
        )}
        <RcSnackbarContent
          data-sign="notification"
          data-sign-type={type}
          type={type}
          size={size}
          fullWidth={fullWidth}
          loading={loading}
          classes={combineProps(
            {
              root: classNames('animated', styles.snackbar, animation),
            },
            snackbarClass,
          )}
          style={animationStyle}
          messageAlign={messageAlign}
          message={
            <Message
              message={data}
              currentLocale={currentLocale}
              brand={brand}
            />
          }
          action={
            action === undefined ? (
              <RcSnackbarAction
                variant="icon"
                symbol={closeSvg}
                size="small"
                onClick={() => {
                  dismiss(id);
                }}
              />
            ) : (
              action
            )
          }
        />
      </div>
    );
  },
);

NotificationItem.defaultProps = {
  duration: 500,
  classes: {},
  size: 'small',
  messageAlign: 'left',
  fullWidth: true,
};
