import React from 'react';
import PropTypes from 'prop-types';

import { formatDuration } from '@ringcentral-integration/commons/lib/formatDuration';

import {
  RcListItem,
  RcListItemText,
  RcIconButton,
  styled,
  palette2,
  ellipsis,
} from '@ringcentral/juno';
import {
  PlayCircleBorder,
  AddTextLog,
  PlayBorder,
} from '@ringcentral/juno-icon';

import { ActionMenu } from '../ActionMenu';
import i18n from './i18n';

const StyledListItem = styled(RcListItem)`
  padding: 12px 16px;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};

  .RcListItemText-primary {
    font-size: 0.875rem;
    line-height: 20px;
  }

  .meeting-item-action-menu {
    display: none;
  }

  &:hover {
    .meeting-item-time {
      display: none;
    }
    .meeting-item-action-menu {
      display: block;
    }
  }
`;

const StyledSecondary = styled.div`
  display: flex;
  align-items: center;
  flex-direction: row;
  margin-top: 4px;
`;

const DetailArea = styled.div`
  flex: 1;
  overflow: hidden;
  ${ellipsis()}
  display: flex;
  align-items: center;
  flex-direction: row;
`;

const Separator = styled.hr`
  position: relative;
  border: 0px;
  flex-shrink: 0;
  overflow: initial;
  width: 1px;
  height: 16px;
  margin: 0px 4px;
  background-color: ${palette2('neutral', 'l03')};
`;

const StyledPlayIcon = styled(RcIconButton)`
  margin-right: 4px;
`;

export const StyledActionMenu = styled(ActionMenu)`
  position: absolute;
  right: 16px;
  top: 50%;
  margin-top: -16px;

  .RcIconButton-root {
    margin-left: 6px;
  }
`;

export default function MeetingItem({
  displayName,
  hostInfo,
  startTime,
  onClick,
  currentLocale,
  dateTimeFormatter,
  recordings,
  id,
  onLog,
  showLog,
  logTitle,
  duration,
  type,
}) {
  const recording = recordings && recordings[0]
  const recodingIcon = recording && recording.metadata ? (
    <StyledPlayIcon
      stretchIcon
      variant="plain"
      symbol={PlayCircleBorder}
      onClick={() => {
        onClick(id)
      }}
      size="small"
      color="action.primary"
    />
  ) : null;
  let durationValue = duration;
  if (type === 'recordings' && recording && recording.metadata) {
    durationValue = recording.metadata.duration;
  }

  const hostContent = hostInfo ? (
    <span>
      {hostInfo.displayName}
    </span>
  ) : null;
  
  const actions = [];
  if (recording) {
    actions.push({
      icon: PlayBorder,
      onClick: () => {
        onClick(id);
      },
      title: i18n.getString('play', currentLocale),
    });
  }
  if (showLog) {
    actions.push({
      icon: AddTextLog,
      onClick: onLog,
      title: logTitle || i18n.getString('log', currentLocale),
    });
  }
  return (
    <StyledListItem>
      <RcListItemText
        primary={displayName}
        secondary={
          <StyledSecondary>
            <DetailArea>
              {recodingIcon}
              <span>
                {formatDuration(durationValue)}
              </span>
              {
                hostInfo ? 
                (<Separator />) :
                null
              }
              {hostContent}
            </DetailArea>
            <span className="meeting-item-time">
              {dateTimeFormatter(startTime)}
            </span>
          </StyledSecondary>
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
      />
      <StyledActionMenu
        size="small"
        maxActions={2}
        className="meeting-item-action-menu"
        iconVariant="contained"
        color="neutral.b01"
        actions={actions}
      />
    </StyledListItem>
  );
}

MeetingItem.propsTypes = {
  displayName: PropTypes.string.isRequired,
  hostInfo: PropTypes.object.isRequired,
  startTime: PropTypes.string.isRequired,
  currentLocale: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  dateTimeFormatter: PropTypes.func.isRequired,
  onPlayRecording: PropTypes.func,
  id: PropTypes.string.isRequired,
  onLog: PropTypes.func,
  showLog: PropTypes.bool,
  logTitle: PropTypes.string,
};

MeetingItem.defaultProps = {
  isRecording: false,
  duration: undefined,
  onClick: undefined,
  onLog: undefined,
  showLog: false,
  logTitle: ''
};
