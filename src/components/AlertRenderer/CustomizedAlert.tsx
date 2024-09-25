import React from 'react';
import {
  styled,
  RcTypography,
  RcLink,
  RcIcon,
  palette2,
} from '@ringcentral/juno';
import { ReportAnIssue, InfoBorder } from '@ringcentral/juno-icon';

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledIcon = styled(RcIcon)`
  margin-right: 6px;
  vertical-align: middle;
  display: inline-block;
`;

const DetailContainer = styled.div`
  margin-top: 4px;
`;

const DetailTitle = styled(RcTypography)`
  margin: 4px 0;
`;

const ItemText = styled(RcTypography)`
  margin-bottom: 4px;
`;

function Detail({ title, items, onLinkClick }) {
  return (
    <DetailContainer>
      <DetailTitle variant="body2">
        {title}
      </DetailTitle>
      {
        items.map((item, idx) => {
          if (item.type === 'text' && item.text) {
            return (
              <ItemText key={idx} variant="body1">
                {item.text}
              </ItemText>
            )
          }
          if (item.type === 'link' && item.text) {
            return (
              <ItemText key={idx}>
                <RcLink
                  href={item.href}
                  onClick={() => onLinkClick(item.id)}
                  target="_blank"
                >
                  {item.text}
                </RcLink>
              </ItemText>
            );
          }
          return null;
        })
      }
    </DetailContainer>
  );
}

const StyleMessage = styled(RcTypography)`
  font-size: 1rem;
  line-height: 1.5rem;
`;

export function CustomizedAlert({
  message,
  showMore = false,
  onLinkClick,
}) {
  const { payload, level } = message;
  return (
    <Container>
      <StyleMessage>
        <StyledIcon
          symbol={level === 'danger' ? ReportAnIssue : InfoBorder}
          size="small"
        />
        {payload && payload.alertMessage}
      </StyleMessage>
      {showMore && payload.details && payload.details.length > 0 && (
        payload.details.map((detail, idx) => (
          <Detail
            key={idx}
            title={detail.title}
            items={detail.items}
            onLinkClick={onLinkClick}
          />
        ))
      )}
    </Container>
  )
}