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
  RcCardActions,
  RcTypography,
  styled,
  palette2,
  css,
  ellipsis,
  useAvatarColorToken,
  useAvatarShortName,
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

const MetaContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  span {
    ${ellipsis}
  }

  span:first-child {
    line-height: 22px;
  }
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
              src={item.icon || item.authorAvatar}
              title={item.authorName}
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
        (item.meta || item.authorName || showAsNavigation) ? (
          <RcListItemSecondaryAction>
            <MetaContainer>
              {item.authorName && <span>{item.authorName}</span>}
              {item.meta && <span>{item.meta}</span>}
            </MetaContainer>
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
  width: 100%;
  ${ellipsis}
`;

const StyledCardAuthorAvatar = styled(RcAvatar)`
  .RcAvatar-avatarContainer {
    width: 12px;
    height: 12px;
    line-height: 12px;
    font-size: 0.625rem;
  }
`;

const AuthorAvatarWrapper = styled.div`
  margin-right: 4px;
  display: flex;
`;

const StyledCardContent = styled(RcCardContent)`
  padding-bottom: 0;
`;

const ActionArea = ({
  children,
  readOnly,
  onClick,
  disabled,
}) => {
  if (readOnly) {
    return <div>{children}</div>;
  }
  return (
    <RcCardActionArea onClick={onClick} component="div" disabled={disabled}>
      {children}
    </RcCardActionArea>
  );
};

function CardItem({
  item,
  disabled,
  onClick,
  width,
  onClickAuthor,
  height,
  readOnly,
}) {
  const cardStyle: {
    backgroundColor?: string;
    height?: string;
  } = {};
  if (item.backgroundColor) {
    cardStyle.backgroundColor = item.backgroundColor;
  }
  if (height) {
    cardStyle.height = height;
  }
  const wrapperStyle: {
    width?: string;
  } = {};
  if (width) {
    wrapperStyle.width = width;
  }
  let shortName = '';
  let avatarColor;
  if (item.authorName) {
    const [firstName, lastName] = item.authorName.split(/\s+/);
    shortName = useAvatarShortName({
      firstName,
      lastName,
    });
    avatarColor = useAvatarColorToken(item.authorName);
  }

  return (
    <StyledCardWrapper
      style={wrapperStyle}
    >
      <StyledCard
        style={cardStyle}
      >
        <ActionArea
          onClick={onClick}
          readOnly={readOnly}
          disabled={disabled}
        >
          <StyledCardContent>
            <CardTitle variant="body2">{item.title}</CardTitle>
            <StyledCardBody variant="caption1" color="neutral.f05">
              {item.description}
            </StyledCardBody>
          </StyledCardContent>
          <RcCardActions>
            <StyledCardFooter>
              {
                item.authorName && (
                  <AuthorAvatarWrapper onClick={onClickAuthor}>
                    <StyledCardAuthorAvatar
                      size="xxsmall"
                      src={item.authorAvatar}
                      title={item.authorName}
                      color={avatarColor}
                      useRcTooltip
                    >
                      {shortName}
                    </StyledCardAuthorAvatar>
                  </AuthorAvatarWrapper>
                )
              }
              <RcTypography variant="caption1" color="neutral.f05">{item.meta}</RcTypography>
            </StyledCardFooter>
          </RcCardActions>
        </ActionArea>
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
  onFocus,
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
  const readOnly =
    typeof uiSchema['ui:readonly'] === 'undefined' ?
    false :
    uiSchema['ui:readonly'];
  const itemWidget = uiSchema['ui:itemWidget'];
  const isCard = uiSchema['ui:itemType'] === 'card' || itemWidget === 'card';
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
          onClick={(e) => {
            if (readOnly) {
              return;
            }
            onChange(item.const);
          }}
          readOnly={readOnly}
          showIconAsAvatar={showIconAsAvatar}
          showAsNavigation={showAsNavigation}
          width={uiSchema['ui:itemWidth']}
          height={uiSchema['ui:itemHeight']}
          onClickAuthor={(e) => {
            e.stopPropagation();
            onFocus(`${item.const}-author`, '$$clicked');
          }}
        />
      ))}
    </Container>
  );
}
