import React from 'react';

import {
  RcList,
  RcListItem,
  RcListItemText,
  RcListItemAvatar,
  RcListItemSecondaryAction,
  RcAvatar,
  RcIcon,
  RcCard,
  RcCardContent,
  RcCardActionArea,
  RcTypography,
  styled,
  palette2,
  css,
  ellipsis,
} from '@ringcentral/juno';

import { ArrowRight } from '@ringcentral/juno-icon';

const StyledList = styled(RcList)`
  margin: 0 -16px;
`;

const StyledItem = styled(RcListItem)`
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  cursor: pointer;
`;

const StyledAvatar = styled(RcAvatar)`
  .RcAvatar-avatarContainer {
    ${({ $round }) => 
      $round ? '' : css`
        border-radius: 0;
        background: transparent;
      `
    }
  }
`;

const NavigationIcon = styled(RcIcon)`
  margin: 8px 0;
`;

function ListItem({
  item,
  disabled,
  selected,
  onClick,
  showIconAsAvatar,
  showAsNavigation,
}) {
  return (
    <StyledItem
      key={item.const}
      disabled={disabled}
      selected={selected}
      onClick={onClick}
    >
      {
        item.icon ? (
          <RcListItemAvatar>
            <StyledAvatar
              size="xsmall"
              src={item.icon}
              $round={showIconAsAvatar}
            />
          </RcListItemAvatar>
        ) : null
      }
      <RcListItemText
        primary={item.title}
        secondary={item.description}
      />
      {
        (item.meta || showAsNavigation) ? (
          <RcListItemSecondaryAction>
            {item.meta}
            {
              showAsNavigation ? (
                <NavigationIcon
                  symbol={ArrowRight}
                  size="large"
                />
              ) : null
            }
          </RcListItemSecondaryAction>
        ) : null
      }
    </StyledItem>
  );
}

const CardTitle = styled(RcTypography)`
  height: 22px;
  ${ellipsis}
`;

const StyledCardBody = styled(RcTypography)`
  margin-top: 4px;
  height: 32px;
  ${ellipsis}
  white-space: break-spaces;
`;

const StyledCard = styled(RcCard)`
  width: 100%;
`;

const StyledCardWrapper = styled.div`
  padding: 4px;
  width: 100%;
`;

const StyledCardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-direction: row;
  align-items: center;
  margin-top: 4px;
  height: 16px;
  ${ellipsis}
`;

function CardItem({
  item,
  disabled,
  onClick,
  width,
}) {
  const cardStyle: {
    backgroundColor?: string;
  } = {};
  if (item.backgroundColor) {
    cardStyle.backgroundColor = item.backgroundColor;
  }
  const wrapperStyle: {
    width?: string;
  } = {};
  if (width) {
    wrapperStyle.width = width;
  }
  return (
    <StyledCardWrapper
      style={wrapperStyle}
    >
      <StyledCard
        style={cardStyle}
      >
        <RcCardActionArea
          onClick={onClick}
          disabled={disabled}
        >
          <RcCardContent>
            <CardTitle variant="body2">{item.title}</CardTitle>
            <StyledCardBody variant="caption1" color="neutral.f05">
              {item.description}
            </StyledCardBody>
            <StyledCardFooter>
              <RcTypography variant="caption1" color="neutral.f05">{item.meta}</RcTypography>
            </StyledCardFooter>
          </RcCardContent>
        </RcCardActionArea>
      </StyledCard>
    </StyledCardWrapper>
  );
}

const StyledCardList = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
`;

export function List({
  schema,
  uiSchema,
  disabled,
  formData,
  onChange,
}) {
  const showIconAsAvatar = 
    typeof uiSchema['ui:showIconAsAvatar'] === 'undefined' ?
    true :
    uiSchema['ui:showIconAsAvatar'];
  const showAsNavigation = 
    typeof uiSchema['ui:navigation'] === 'undefined' ?
    false :
    uiSchema['ui:navigation'];
  const showSelected =
    typeof uiSchema['ui:showSelected'] === 'undefined' ?
    true :
    uiSchema['ui:showSelected'];
  const itemWidget = uiSchema['ui:itemWidget'];
  const isCard = uiSchema['ui:itemType'] === 'card';
  const Item = isCard ? CardItem : ListItem;
  const Container = isCard ? StyledCardList : StyledList;
  return (
    <Container>
      {schema.oneOf.map((item) => (
        <Item
          key={item.const}
          item={item}
          disabled={disabled}
          selected={showSelected && formData === item.const}
          onClick={() => {
            onChange(item.const);
          }}
          showIconAsAvatar={showIconAsAvatar}
          showAsNavigation={showAsNavigation}
          width={uiSchema['ui:itemWidth']}
        />
      ))}
    </Container>
  );
}
