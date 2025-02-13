import type { FC } from 'react';
import React, { useEffect } from 'react';

import { styled } from '@ringcentral/juno/foundation';
import i18n from '@ringcentral-integration/widgets/components/ConferenceDialerPanel/i18n';
import type { DialerPanelProps } from '../DialerPanel';
import DialerPanel from '../DialerPanel';
import { BackHeader } from '../BackHeader';

type ConferenceDialerPanelProps = {
  onBack: () => void;
  setLastSessionId: () => void;
} & DialerPanelProps;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const Content = styled.div`
  flex: 1;
  padding-top: 30px;
`;

export const ConferenceDialerPanel: FC<ConferenceDialerPanelProps> = (
  props,
) => {
  const { onBack, setLastSessionId, ...baseProps } = props;

  useEffect(() => {
    setLastSessionId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container>
      <BackHeader
        onBack={onBack}
        label={i18n.getString('activeCall', props.currentLocale)}
      />
      <Content>
        <DialerPanel key="dialer" {...baseProps} />
      </Content>
    </Container>
  );
};
