import type { FunctionComponent } from 'react';
import React from 'react';

import { styled, palette2 } from '@ringcentral/juno/foundation';
import Panel from '@ringcentral-integration/widgets/components/Panel';
import { SpinnerOverlay } from '@ringcentral-integration/widgets/components/SpinnerOverlay';
import type { BasePanelProps } from '@ringcentral-integration/widgets/components/SettingsPanel/SettingsPanel.interface';

import { Footer } from './Footer';

const StyledContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const StyledPanel = styled(Panel)`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  overflow-y: auto;
  box-sizing: border-box;
  background-color: ${palette2('neutral', 'b02')};
`;

interface NewBasePanelProps extends BasePanelProps {
  ringSenseLicensed: boolean;
  ringCXLicensed: boolean;
  isAdmin: boolean;
}

export const BasePanel: FunctionComponent<NewBasePanelProps> = ({
  currentLocale,
  className,
  showSpinner,
  children,
  loginNumber,
  onLogoutButtonClick,
  eulaLabel,
  eulaLink,
  onEulaLinkClick,
  version,
  versionContainer,
  ringSenseLicensed,
  ringCXLicensed,
  isAdmin,
}) => {
  if (showSpinner) {
    return <SpinnerOverlay />;
  }

  return (
    <StyledContainer className="SettingsPanel_root">
      <StyledPanel>
        {children}
        <Footer
          {...{
            loginNumber,
            currentLocale,
            eulaLabel,
            eulaLink,
            onEulaLinkClick,
            onLogoutButtonClick,
            version,
            versionContainer,
            ringSenseLicensed,
            ringCXLicensed,
            isAdmin,
          }}
        />
      </StyledPanel>
    </StyledContainer>
  );
};
