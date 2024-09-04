import type { FunctionComponent } from 'react';
import React from 'react';

import { styled, RcText } from '@ringcentral/juno';
import { Eula } from '@ringcentral-integration/widgets/components/Eula';
import Line from '@ringcentral-integration/widgets/components/Line';
import i18n from '@ringcentral-integration/widgets/components/SettingsPanel/i18n';
import type { FooterProps } from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';
import { LogoutItem } from './SettingItem';

const StyledSection = styled.section`
  padding-top: 8px;
`;

const StyledVersionContainer = styled(RcText)`
  padding: 10px 16px;
  font-size: 0.815rem;
`;

export const Footer: FunctionComponent<FooterProps> = ({
  loginNumber,
  currentLocale,
  version,
  versionContainer,
  onLogoutButtonClick,
  eulaLabel,
  eulaLink,
  onEulaLinkClick,
}) => {
  const versionArea = versionContainer || (
    <StyledVersionContainer
      data-sign="version"
      color="neutral.f04"
    >
      {i18n.getString('version', currentLocale)} {version}
    </StyledVersionContainer>
  );
  return (
    <>
      <StyledSection>
        <Line noBorder>
          <Eula
            dataSign="eula"
            currentLocale={currentLocale}
            link={eulaLink}
            label={eulaLabel}
            onClick={onEulaLinkClick}
          />
        </Line>
      </StyledSection>
      <StyledSection>
        <LogoutItem
          onLogout={onLogoutButtonClick}
          loginNumber={loginNumber}
          currentLocale={currentLocale}
        />
      </StyledSection>
      {versionArea}
    </>
  );
};
