import React, { useState } from 'react';
import {
  RcButton,
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcDialogActions,
  RcMenuItem,
  RcListItemText,
  RcAlert,
  RcTextField,
  styled,
  RcDownshift,
  RcIcon,
} from '@ringcentral/juno';
import { Search } from '@ringcentral/juno-icon';

const StyledTextField = styled(RcTextField)`
  margin-bottom: 15px;

  .icon {
    margin-right: 5px;
  }
`;

const StyledDownshift = styled(RcDownshift)`
  .search {
    margin-right: 5px;
  }

  .RcDownshiftInput-container {
    width: auto;
    flex: 1;
  }
`;

export default function GlipTeamCreationModalV2({
  show,
  closeModal,
  createTeam,
  updateFilter,
  searchFilter,
  filteredContacts,
}: {
  show: boolean;
  closeModal: () => void;
  createTeam: (args: any) => Promise<void>;
  updateFilter: (args: string) => void;
  searchFilter: string;
  filteredContacts: any[];
}) {
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [teamName, setTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  let contacts;
  if (searchFilter.length < 3) {
    contacts = [];
  } else {
    contacts = filteredContacts
      .filter((c) => c.emails && c.emails.length > 0)
      .slice(0, 10);
  }

  return (
    <RcDialog
      open={show}
      onClose={() => {
        updateFilter('');
        setSelectedContacts([]);
        setTeamName('');
        closeModal();
      }}
      fullScreen
    >
      <RcDialogTitle>Create Team</RcDialogTitle>
      <RcDialogContent>
        {
          error ? (
            <RcAlert severity="warning">{error}</RcAlert>
          ) : null
        }
        <StyledTextField
          value={teamName}
          onChange={(e) => {
            setTeamName(e.target.value);
            setError(null);
          }}
          placeholder="Team name"
          fullWidth
        />
        <StyledDownshift
          value={selectedContacts}
          InputProps={{
            startAdornment: (
              <RcIcon
                size="small"
                symbol={Search}
              />
            )
          }}
          onChange={(selectedItems) => {
            setSelectedContacts(selectedItems);
          }}
          onInputChange={(value) => {
            updateFilter(value);
          }}
          placeholder='Search and add people..'
          multiple
          options={contacts.map((c) => {
            const email = c.email || (c.emails && c.emails[0]);
            return {
              id: c.id,
              label: c.name,
              name: c.name,
              email: email,
            };
          })}
          renderOption={({
            id,
            ...item
          }, state) => {
            return (
              <RcMenuItem
                id={id}
                key={`${id}-${state.index}`}
                focused={state.highlighted}
                onClick={item.onClick}
              >
                <RcListItemText
                  primary={item.label}
                  secondary={item.email}
                />
              </RcMenuItem>
            )
          }}
        />
      </RcDialogContent>
      <RcDialogActions>
        <RcButton
          variant="outlined"
          onClick={() => {
            updateFilter('');
            setSelectedContacts([]);
            setTeamName('');
            closeModal();
          }}
        >
          Cancel
        </RcButton>
        <RcButton
          disabled={teamName === '' || selectedContacts.length === 0 || selectedContacts.length === 0}
          onClick={async () => {
            if (creating) {
              return;
            }
            if (teamName === '') {
              setError('Please enter a valid team name.');
              return;
            }
            if (selectedContacts.length === 0) {
              setError('Please select team number.');
              return;
            }
            setCreating(true);
            try {
              await createTeam({
                teamName,
                selectedContacts: selectedContacts.map((c) => ({
                  name: c.name,
                  email: c.email,
                })),
              });
              updateFilter('');
              setSelectedContacts([]);
              setTeamName('');
              setCreating(false);
              closeModal();
            } catch (e) {
              console.error(e);
              setError(e.message || 'An error occurred');
              setCreating(false);
            }
          }}
          color="action.primary"
          loading={creating}
        >
          Create
        </RcButton>
      </RcDialogActions>
    </RcDialog>
  );
}
