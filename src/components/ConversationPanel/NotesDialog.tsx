import React, { useState } from 'react';
import {
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcIconButton,
  RcTextField,
  RcTypography,
  RcLoading,
  RcDivider,
  RcMenu,
  RcMenuItem,
  RcListItemText,
  styled,
  palette2,
  RcIcon,
} from '@ringcentral/juno';
import { Close, Notes, MoreVert, Edit, Delete, SaveDraft } from '@ringcentral/juno-icon';
import type { AliveNote } from '../../modules/MessageThreadEntries/MessageThreadEntries.interface';

const StyledDialog = styled(RcDialog)`
  .MuiDialog-paper {
    width: calc(100% - 32px);
    margin: 16px;
    padding: 0;
    max-height: calc(100% - 32px);
    display: flex;
    flex-direction: column;
  }
`;

const StyledHeader = styled(RcDialogTitle)`
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NotesIcon = styled(RcIcon)`
  color: ${palette2('neutral', 'f04')};
`;

const CloseButton = styled(RcIconButton)`
  margin-right: -8px;
`;

const StyledDialogContent = styled(RcDialogContent)`
  padding: 0;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  flex: 1;
`;

const EmptyIcon = styled(RcIcon)`
  margin-bottom: 16px;
`;

const EmptyText = styled(RcTypography)`
  color: ${palette2('neutral', 'f04')};
  text-align: center;
  max-width: 280px;
`;

const NotesListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const NoteItemContainer = styled.div`
  padding: 12px 16px;
  position: relative;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
`;

const NoteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const NoteContent = styled.div`
  flex: 1;
`;

const NoteText = styled(RcTypography)`
  color: ${palette2('neutral', 'f06')};
  margin-bottom: 4px;
  word-wrap: break-word;
`;

const NoteMeta = styled(RcTypography)`
  color: ${palette2('neutral', 'f04')};
`;

const MoreButton = styled(RcIconButton)`
  margin: -8px -8px -8px 8px;
  flex-shrink: 0;
`;

const InputContainer = styled.div`
  padding: 12px 16px;
  border-top: 1px solid ${palette2('neutral', 'l02')};
  flex-shrink: 0;
`;

const StyledTextField = styled(RcTextField)`
  .RcTextFieldInput-input {
    padding: 10px 0;
  }

  .MuiOutlinedInput-notchedOutline {
    border: none;
  }

  .RcOutlineTextFieldInput-root {
    padding: 0 12px;
  }
`;

const EditContainer = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
`;

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

interface NoteItemProps {
  note: AliveNote;
  isEditing: boolean;
  editValue: string;
  isAuthor: boolean;
  formattedTime: string;
  onEditValueChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  readOnly: boolean;
}

function NoteItem({
  note,
  isEditing,
  editValue,
  isAuthor,
  formattedTime,
  onEditValueChange,
  onEditSave,
  onEditCancel,
  onMenuOpen,
  readOnly,
}: NoteItemProps) {
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEditSave();
    } else if (e.key === 'Escape') {
      onEditCancel();
    }
  };

  if (isEditing) {
    return (
      <EditContainer>
        <StyledTextField
          fullWidth
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={handleEditKeyDown}
          placeholder="Edit note"
          autoFocus
          variant="outline"
          size="small"
          multiline
          minRows={1}
          clearBtn={false}
        />
        <EditActions>
          <RcIconButton
            symbol={Close}
            size="small"
            onClick={onEditCancel}
            title="Cancel"
          />
          <RcIconButton
            symbol={SaveDraft}
            size="small"
            color="interactive.f01"
            onClick={onEditSave}
            disabled={!editValue.trim()}
            title="Save"
          />
        </EditActions>
      </EditContainer>
    );
  }

  return (
    <NoteItemContainer>
      <NoteHeader>
        <NoteContent>
          <NoteText variant="body1">{note.text}</NoteText>
          <NoteMeta variant="caption1">
            {note.author?.name || 'Unknown'} | {formattedTime}
          </NoteMeta>
        </NoteContent>
        {isAuthor && !readOnly && (
          <MoreButton
            symbol={MoreVert}
            size="small"
            onClick={onMenuOpen}
            data-sign={`noteMenu-${note.id}`}
            title="More options"
          />
        )}
      </NoteHeader>
    </NoteItemContainer>
  );
}

interface NotesDialogProps {
  open: boolean;
  notes: AliveNote[];
  onClose: () => void;
  onCreateNote: (text: string) => Promise<void>;
  onUpdateNote: (noteId: string, text: string) => Promise<void>;
  onDeleteNote: (noteId: string) => Promise<void>;
  dateTimeFormatter: (params: { utcTimestamp: number }) => string;
  myExtensionId: string;
  loading?: boolean;
  readOnly?: boolean;
}

export function NotesDialog({
  open,
  notes,
  onClose,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  dateTimeFormatter,
  myExtensionId,
  loading = false,
  readOnly = false,
}: NotesDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [selectedNote, setSelectedNote] = useState<AliveNote | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSubmit = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onCreateNote(trimmedValue);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClose = () => {
    setInputValue('');
    setEditingNoteId(null);
    setEditValue('');
    onClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, note: AliveNote) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedNote(note);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedNote(null);
  };

  const handleEditClick = () => {
    if (selectedNote) {
      setEditingNoteId(selectedNote.id);
      setEditValue(selectedNote.text);
    }
    handleMenuClose();
  };

  const handleDeleteClick = async () => {
    if (selectedNote) {
      setSubmitting(true);
      try {
        await onDeleteNote(selectedNote.id);
      } catch (error) {
        console.error('Failed to delete note:', error);
      } finally {
        setSubmitting(false);
      }
    }
    handleMenuClose();
  };

  const handleEditSave = async () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue || !editingNoteId || submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await onUpdateNote(editingNoteId, trimmedValue);
      setEditingNoteId(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update note:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setEditingNoteId(null);
    setEditValue('');
  };

  const isNoteAuthor = (note: AliveNote) => {
    return note.author?.extensionId === myExtensionId;
  };

  // Sort notes by creation time, newest first
  const sortedNotes = [...notes].sort((a, b) => {
    const timeA = typeof a.creationTime === 'number' ? a.creationTime : new Date(a.creationTime).getTime();
    const timeB = typeof b.creationTime === 'number' ? b.creationTime : new Date(b.creationTime).getTime();
    return timeB - timeA;
  });

  const formatNoteTime = (creationTime: string | number) => {
    const timestamp = typeof creationTime === 'number' ? creationTime : new Date(creationTime).getTime();
    return dateTimeFormatter({ utcTimestamp: timestamp });
  };

  return (
    <StyledDialog open={open} onClose={handleClose}>
      <StyledHeader disableTypography>
        <HeaderLeft>
          <NotesIcon symbol={Notes} size="medium" />
          <RcTypography variant="subheading2">Notes</RcTypography>
        </HeaderLeft>
        <CloseButton
          symbol={Close}
          onClick={handleClose}
          data-sign="closeButton"
          title="Close"
        />
      </StyledHeader>

      <StyledDialogContent>
        <RcLoading loading={loading || submitting}>
          {sortedNotes.length === 0 ? (
            <EmptyStateContainer>
              <EmptyIcon symbol={Notes} size="xxxlarge" color="neutral.f04" />
              <EmptyText variant="body1">
                Track important info by attaching a note to this conversation.
              </EmptyText>
            </EmptyStateContainer>
          ) : (
            <NotesListContainer>
              {sortedNotes.map((note, index) => (
                <NoteItem
                  note={note}
                  key={note.id}
                  isEditing={editingNoteId === note.id}
                  editValue={editValue}
                  isAuthor={isNoteAuthor(note)}
                  formattedTime={formatNoteTime(note.creationTime)}
                  onEditValueChange={setEditValue}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                  onMenuOpen={(e) => handleMenuOpen(e, note)}
                  readOnly={readOnly}
                />
              ))}
            </NotesListContainer>
          )}
        </RcLoading>
      </StyledDialogContent>

      {!readOnly && (
        <InputContainer>
          <StyledTextField
            fullWidth
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note"
            disabled={submitting}
            data-sign="noteInput"
            variant="outline"
            size="small"
            multiline
            minRows={1}
          />
        </InputContainer>
      )}

      <RcMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <RcMenuItem
          onClick={handleEditClick}
          icon={<RcIcon symbol={Edit} size="small" />}
        >
          <RcListItemText primary="Edit" />
        </RcMenuItem>
        <RcMenuItem
          onClick={handleDeleteClick}
          icon={<RcIcon symbol={Delete} size="small" color="danger.f02" />}
        >
          <RcListItemText primary="Delete" />
        </RcMenuItem>
      </RcMenu>
    </StyledDialog>
  );
}
