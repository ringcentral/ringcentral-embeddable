import React from 'react';
import { styled, RcTypography } from '@ringcentral/juno';
import NoText from './noText.svg';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  padding: 20px 32px;
`;

const ImageWrapper = styled.div`
  width: 120px;
  margin-bottom:15px;
`;

const Description = styled(RcTypography)`
  width: 100%;
  text-align: center;
  margin-bottom: 15px;
`;

export function NoTextPermission() {
  return (
    <Container>
      <ImageWrapper>
        <NoText width={120} height={120} />
      </ImageWrapper>
      <Description variant="subheading1" color="neutral.f06">
        Your phone number is not configured to send SMS.
      </Description>
      <Description variant="body1" color="neutral.f05">
        Contact your company admin for more information.
      </Description>
    </Container>
  );
}
