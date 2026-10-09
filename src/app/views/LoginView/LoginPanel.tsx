import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import type { AuthPageProps } from '@ringcentral-integration/micro-auth/src/app/views/LoginView/AuthPage';
import { SpringSpinnerOverlay } from '@ringcentral-integration/next-widgets/components';
import i18n from '@ringcentral-integration/widgets/components/LoginPanel/i18n';
import { Button } from '@ringcentral/spring-ui';
import React, { type FunctionComponent } from 'react';

type LoginPanelProps = Pick<
  AuthPageProps,
  | 'disabled'
  | 'showSpinner'
  | 'showSignUp'
  | 'openOAuthPage'
  | 'onSignUpButtonClick'
>;

/** Renders the embeddable login actions with the legacy button labels. */
export const LoginPanel: FunctionComponent<LoginPanelProps> = ({
  disabled,
  showSpinner = false,
  showSignUp,
  openOAuthPage,
  onSignUpButtonClick,
}) => {
  const { t } = useLocale(i18n);
  return (
    <SpringSpinnerOverlay loading={showSpinner}>
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-base px-[10%]">
        <Button
          fullWidth
          onClick={openOAuthPage}
          disabled={disabled}
          data-sign="loginButton"
        >
          {t('loginButton')}
        </Button>
        {showSignUp && (
          <Button
            variant="outlined"
            fullWidth
            onClick={onSignUpButtonClick}
            data-sign="signUpButton"
          >
            {t('signupButton')}
          </Button>
        )}
      </div>
    </SpringSpinnerOverlay>
  );
};
