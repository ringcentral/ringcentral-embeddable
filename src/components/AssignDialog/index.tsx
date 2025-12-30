import React, { useState, useEffect, useMemo } from 'react';
import {
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcIconButton,
  RcTextField,
  RcList,
  RcListItem,
  RcListItemText,
  RcTypography,
  RcLoading,
  styled,
  palette2,
  RcIcon,
} from '@ringcentral/juno';
import { Close, Search as SearchIcon } from '@ringcentral/juno-icon';

import type { MessageThread, SMSRecipient } from '../../modules/MessageThreads/MessageThreads.interface';

const StyledDialog = styled(RcDialog)`
  .MuiDialog-paper {
    width: calc(100% - 32px);
    margin: 16px;
    padding: 16px 0;
  }
`;

const StyledHeader = styled(RcDialogTitle)`
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CloseButton = styled(RcIconButton)`
  margin-right: -8px;
`;

const StyledSearchIcon = styled(RcIcon)`
  margin-right: 8px;
  color: ${palette2('neutral', 'f04')};
`;

const StyledSearchInput = styled(RcTextField)`
  padding: 4px 16px;

  .RcOutlineTextFieldInput-input {
    margin-left: 0;
  }

  .RcOutlineTextFieldInput-root {
    padding: 0 8px;
  }

  .RcTextFieldInput-input:placeholder-shown {
    font-size: 0.8125rem;
  }
`;

const SectionTitle = styled(RcTypography)`
  padding: 8px 16px;
  color: ${palette2('neutral', 'f04')};
`;

const StyledDialogContent = styled(RcDialogContent)`
  padding: 0;
  overflow-y: auto;
`;

const StyledList = styled(RcList)`
  padding: 0;
`;

const EmptyMessage = styled(RcTypography)`
  padding: 24px 16px;
  text-align: center;
  color: ${palette2('neutral', 'f04')};
`;

const LoadingContainer = styled.div`
  padding: 40px 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export function AssignDialog({
  open,
  getSMSRecipients,
  currentAssignee,
  onAssign,
  onCancel,
}: {
  open: boolean;
  getSMSRecipients: () => Promise<SMSRecipient[]>;
  currentAssignee: MessageThread['assignee'];
  onAssign: (assignee: {
    extensionId: string;
  } | null) => void;
  onCancel: () => void;
}) {
  const [searchInput, setSearchInput] = useState('');
  const [recipients, setRecipients] = useState<SMSRecipient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setSearchInput('');
      return;
    }

    const loadRecipients = async () => {
      setLoading(true);
      try {
        const data = await getSMSRecipients();
        setRecipients(data || []);
      } catch (error) {
        console.error('Failed to load SMS recipients:', error);
        setRecipients([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecipients();
  }, [open, getSMSRecipients]);

  const filteredRecipients = useMemo(() => {
    if (!searchInput.trim()) {
      return recipients;
    }

    const searchTerm = searchInput.toLowerCase().trim();
    return recipients.filter((recipient) => {
      const nameMatch = recipient.name?.toLowerCase().includes(searchTerm);
      const extMatch = recipient.extensionNumber?.includes(searchTerm);
      return nameMatch || extMatch;
    });
  }, [recipients, searchInput]);

  const handleSelect = async(recipient: SMSRecipient) => {
    if (currentAssignee?.extensionId === recipient.id) {
      return;
    }
    try {
      setLoading(true);
      await onAssign({
        extensionId: recipient.id,
      });
      onCancel();
    } catch (error) {
      console.error('Failed to assign conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledDialog open={open} onClose={onCancel}>
      <StyledHeader disableTypography>
        <RcTypography variant="subheading2">Assign conversation to</RcTypography>
        <CloseButton
          symbol={Close}
          onClick={onCancel}
          data-sign="closeButton"
          title="Close"
        />
      </StyledHeader>

      <StyledSearchInput
        fullWidth
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder="Search by name or number"
        clearBtn={searchInput.length > 0}
        data-sign="searchInput"
        variant="outline"
        InputProps={{
          startAdornment: <StyledSearchIcon symbol={SearchIcon} size="small" />,
        }}
      />
      <SectionTitle variant="caption1">Company contacts</SectionTitle>
      <StyledDialogContent>
        <RcLoading loading={loading}>
         {
            filteredRecipients.length === 0 ? (
              <EmptyMessage variant="body1">
                {searchInput ? 'No contacts found' : 'No contacts available'}
              </EmptyMessage>
            ) : (
              <StyledList>
                {filteredRecipients
                  .filter((recipient) => recipient.id !== currentAssignee?.extensionId)
                  .map((recipient) => {
                    const isAssignable = recipient.assignable;
                    return (
                      <RcListItem
                        key={recipient.id}
                        onClick={() => isAssignable && handleSelect(recipient)}
                        disabled={!isAssignable}
                        data-sign={`contactItem-${recipient.id}`}
                      >
                        <RcListItemText
                          primary={recipient.name}
                          secondary={`Ext. ${recipient.extensionNumber}`}
                        />
                      </RcListItem>
                    );
                  })
                }
              </StyledList>
            )
          }
        </RcLoading>
      </StyledDialogContent>
    </StyledDialog>
  );
}

