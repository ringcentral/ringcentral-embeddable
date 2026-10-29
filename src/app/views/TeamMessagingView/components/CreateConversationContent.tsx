import { useModalItemView } from '@ringcentral-integration/micro-core/src/app/views';
import { Button, DialogActions } from '@ringcentral/spring-ui';
import React, { useState } from 'react';

import { MAX_CONVERSATION_PEOPLE } from '../../../services/TeamMessaging';
import { t } from '../i18n';
import type { CreateConversationContentProps } from '../TeamMessaging.view.interface';
import { type PeopleOption, PeoplePicker } from './PeoplePicker';

function getErrorText(count: number): string | undefined {
  if (count === 0) {
    return t('membersRequired');
  }
  if (count > MAX_CONVERSATION_PEOPLE) {
    return t('tooManyPeople', { max: MAX_CONVERSATION_PEOPLE });
  }
  return undefined;
}

/**
 * The "New conversation" dialog body: the people to talk with. One person
 * opens a 1:1 chat, more open a group; an existing conversation with the same
 * people opens instead of a new one.
 */
export function CreateConversationContent({
  searchContacts,
  onStart,
  onCancel,
}: CreateConversationContentProps): React.ReactElement {
  const { action } = useModalItemView();
  const [selected, setSelected] = useState<PeopleOption[]>([]);
  const [starting, setStarting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const errorText = getErrorText(selected.length);
  const handleStart = async (): Promise<void> => {
    setShowErrors(true);
    if (errorText) {
      return;
    }
    setStarting(true);
    const result = await onStart(selected.map((contact) => contact.id));
    setStarting(false);
    if (result?.ok) {
      action?.close('confirmClick');
    }
  };
  const handleCancel = (): void => {
    onCancel();
    action?.cancel('cancelClick');
  };
  return (
    <>
      <div data-sign="createConversationDialog">
        <PeoplePicker
          searchContacts={searchContacts}
          selected={selected}
          onChange={setSelected}
          errorText={showErrors ? errorText : undefined}
          autoFocus
          data-sign="createConversationSearchInput"
        />
      </div>
      <DialogActions className="pr-0">
        <Button
          data-sign="DialogCancelButton"
          color="secondary"
          variant="outlined"
          disabled={starting}
          onClick={handleCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          data-sign="DialogConfirmButton"
          loading={starting}
          disabled={starting}
          onClick={handleStart}
        >
          {t('start')}
        </Button>
      </DialogActions>
    </>
  );
}
