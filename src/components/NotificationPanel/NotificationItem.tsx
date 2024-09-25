import type { FunctionComponent } from 'react';
import React, { memo, useMemo, useState,  useEffect} from 'react';

import classNames from 'classnames';

import type { RcSnackbarContentType } from '@ringcentral/juno';
import {
  combineProps,
  RcSnackbarAction,
  RcSnackbarContent,
  RcText,
  RcLink,
  styled,
  getParsePaletteColor,
  css,
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

const RcSnackbarContentColors = {
  success: {
    textColor: 'neutral.f06',
    bgColor: 'success.b01',
  },
  error: {
    textColor: 'danger.f02',
    bgColor: 'danger.b01',
  },
  info: {
    textColor: 'neutral.f06',
    bgColor: 'neutral.b03',
  },
  warn: {
    textColor: 'neutral.f06',
    bgColor: 'warning.b02',
  },
};

const MoreLinkColors = {
  success: 'action.primary',
  error: 'action.primary',
  info: 'action.primary',
  warn: 'action.primary',
};

const StyledSnackbarContent = styled(RcSnackbarContent)`
  color: ${({ type }) => getParsePaletteColor(RcSnackbarContentColors[type].textColor)};
  background-color: ${({ type }) => getParsePaletteColor(RcSnackbarContentColors[type].bgColor)};

  .RcSnackbarContent-message {
    a {
      color: ${({ type }) => getParsePaletteColor(MoreLinkColors[type])};
      font-style: normal!important;
      text-decoration: underline;
    }

    /* .RcSnackbarAction-text {
      a {
        color: ${({ type }) => getParsePaletteColor(MoreLinkColors[type])};
        font-style: normal!important;
        
      }
    } */
  }
`;

const ShowMoreLink = styled(RcLink)`
  font-size: 0.815rem;
  line-height: 24px;
`;

const CounterText = styled(RcText)`
  font-size: 0.815rem;
  line-height: 24px;
  text-align: right;
  flex: 1;
`;

function ClosingCounter({
  ttl,
}) {
  const [time, setTime] = useState(ttl / 1000);
  useEffect(() => {
    let newTime = ttl / 1000;
    let timer;
    function startTimer() {
      timer = setTimeout(() => {
        newTime -= 1;
        setTime(newTime);
        if (newTime > 0) {
          startTimer();
        }
      }, 1000);
    };
    startTimer();
    return () => {
      clearTimeout(timer);
      newTime = 0;
    };
  }, [ttl]);
  return (
    <CounterText>
      Closing in {time} sec...
    </CounterText>
  );
}

const StyledFooter = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  margin-right: -30px;
  margin-top: 5px;
  margin-bottom: 5px;
`;

function Footer({
  showMore,
  onShowMore,
  ttl,
  type,
}) {
  return (
    <StyledFooter>
      {showMore && (
        <RcSnackbarAction
          onClick={onShowMore}
        >
          <ShowMoreLink>
            Show more
          </ShowMoreLink>
        </RcSnackbarAction>
      )}
      {ttl > 0 && <ClosingCounter ttl={ttl} />}
    </StyledFooter>
  );
}

interface NewNotificationItemProps extends NotificationItemProps {
  cancelAutoDismiss: (id: string) => void;
}

export const NotificationItem: FunctionComponent<NewNotificationItemProps> = memo(
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
    cancelAutoDismiss,
  }) => {
    const [showMore, setShowMore] = useState(false);
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
      ttl,
      payload,
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
        <StyledSnackbarContent
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
            <>
              <Message
                message={data}
                currentLocale={currentLocale}
                brand={brand}
                showMore={showMore}
              />
              {
                (
                  !showMore && payload && payload.details && payload.details.length > 0
                ) && (
                  <Footer
                    showMore={!showMore && payload && payload.details && payload.details.length > 0}
                    onShowMore={() => {
                      cancelAutoDismiss(id);
                      setShowMore(true);
                    }}
                    ttl={ttl}
                    type={type}
                  />
                )
              }
            </>
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
