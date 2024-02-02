import React, { useState, useEffect, useRef } from 'react';
import callDirections from '@ringcentral-integration/commons/enums/callDirections';
import LogBasicInfoV2 from '@ringcentral-integration/widgets/components/LogBasicInfoV2'; 
import { styled, palette2 } from '@ringcentral/juno/foundation';
import {
  RcButton,
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcIconButton,
  RcTextarea,
} from '@ringcentral/juno';

import { Previous } from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/CallItem/i18n';

const StyledDialogTitle = styled(RcDialogTitle)`
  padding: 5px 50px;
  position: relative;
  text-align: center;

  .MuiTypography-root {
    font-size: 0.9375rem;
  }
`;

const StyledDialogContent = styled(RcDialogContent)`
  padding: 0;
`;

const BackButton = styled(RcIconButton)`
  position: absolute;
  left: 10px;
  top: 0;
`;

const SaveButton = styled(RcButton)`
  position: absolute;
  right: 15px;
  top: 7px;
`;

const FieldArea = styled.div`
  padding: 20px;

  .RcTextareaInput-inputMultiline {
    background: ${palette2('neutral', 'b01')};
  }
`;

export default function LogCallModal({
  open,
  onClose,
  currentLocale,
  currentCall = null,
  currentLogCall = {},
  onSaveCallLog,
  onLoadData,
  formatPhone,
  dateTimeFormatter,
}) {
  const [note, setNote] = useState('');
  const currentCallRef = useRef(currentCall);
  useEffect(() => {
    if (!currentCall) {
      currentCallRef.current = null;
      return;
    }
    if (
      !currentCallRef.current || (
        currentCall.id !== currentCallRef.current.id
      )
    ) {
      onLoadData(currentCall);
      const matchedActivity =
        currentCall.activityMatches &&
        currentCall.activityMatches[0];
      setNote(matchedActivity && matchedActivity.note ? matchedActivity.note : '');
    }
    const currentMatch = currentCall.activityMatches && currentCall.activityMatches[0];
    const previousMatch = currentCallRef.current && currentCallRef.current.activityMatches && currentCallRef.current.activityMatches[0];
    if (currentMatch && previousMatch && currentMatch !== previousMatch) {
      setNote(currentMatch.note || '');
    }
    currentCallRef.current = currentCall;
  }, [currentCall]);

  if (!currentCall) {
    return null;
  }
  let logName = 'Unknown';
  const nameEntities = currentCall.direction === callDirections.inbound
      ? currentCall.fromMatches : currentCall.toMatches;
  if (nameEntities && nameEntities.length > 0) {
    logName = nameEntities[0].name;
  }
  const isLogged = currentCall.activityMatches && currentCall.activityMatches.length > 0;
  return (
    <RcDialog
      open={open}
      onClose={onClose}
      fullScreen
    >
      <StyledDialogTitle>
        <BackButton
          symbol={Previous}
          onClick={onClose}
          data-sign="backButton"
        />
        {isLogged ? i18n.getString('editLog', currentLocale) : i18n.getString('logCall', currentLocale)}
        <SaveButton
          variant='plain'
          onClick={() => {
            onSaveCallLog({
              call: currentCall,
              note,
            });
          }}
        >
          Save
        </SaveButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <LogBasicInfoV2
          isWide
          currentLog={{
            call: currentCall,
            currentLogCall,
            logName,
          }}
          currentLocale={currentLocale}
          formatPhone={formatPhone}
          dateTimeFormatter={dateTimeFormatter}
        />
        <FieldArea>
          <RcTextarea
            data-sign="logNote"
            label="Note"
            placeholder="Add call log note"
            fullWidth
            minRows={2}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
            }}
            maxLength={1000}
          />
        </FieldArea>
      </StyledDialogContent>
    </RcDialog>
  );
}
