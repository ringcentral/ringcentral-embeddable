import React from 'react';
import PropTypes from 'prop-types';
import i18n from '@ringcentral-integration/widgets/components/LogIcon/i18n';

import { RcIconButton } from '@ringcentral/juno';
import { NewAction } from '@ringcentral/juno-icon';
import { ViewLogBorder } from '@ringcentral/juno-icon';

export default function LogIcon({
    sessionId,
    id,
    onClick,
    isSaving,
    currentLocale,
    disabled,
    isFax,
    logTitle,
}) {
  let tooltip = '';
  if (isFax) {
    tooltip = i18n.getString('faxNotSupported', currentLocale);
  } else if (!id && logTitle) {
    tooltip = logTitle;
  } else {
    tooltip = i18n.getString(id ? 'logged' : 'unlogged', currentLocale);
  }
  const onIconClick = (e) => {
    e.stopPropagation();
    if (disabled) {
      return;
    }
    onClick({
      sessionId,
      id
    });
  };
  if (!id) {
    return (
      <RcIconButton
        symbol={NewAction}
        title={tooltip}
        onClick={onIconClick}
        disabled={disabled || isSaving}
        color="action.primary"
        variant="plain"
        data-sign="createLogBtn"
      />
    );
  }
  return (
    <RcIconButton
      symbol={ViewLogBorder}
      title="View log details"
      onClick={onIconClick}
      color="action.primary"
      variant="plain"
      data-sign="viewLogBtn"
    />
  );
}

LogIcon.propTypes = {
  currentLocale: PropTypes.string.isRequired,
  sessionId: PropTypes.string,
  id: PropTypes.string,
  onClick: PropTypes.func,
  isSaving: PropTypes.bool,
  disabled: PropTypes.bool,
  isFax: PropTypes.bool,
  logTitle: PropTypes.string,
};

LogIcon.defaultProps = {
  sessionId: undefined,
  id: undefined,
  onClick: undefined,
  isSaving: false,
  disabled: false,
  isFax: false,
  logTitle: null
};
