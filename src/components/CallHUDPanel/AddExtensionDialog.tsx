import React, { useState } from 'react';
import {
  RcDialog,
  RcDialogTitle,
  RcDialogContent,
  RcDialogActions,
  RcButton,
  RcDownshift,
  RcMenuItem,
  RcListItemText,
  RcListItemAvatar,
  RcAvatar,
  RcIcon,
  styled,
} from '@ringcentral/juno';
import { People } from '@ringcentral/juno-icon';

const StyledDialog = styled(RcDialog)`
  .MuiDialog-paper {
    width: calc(100% - 32px);
    margin: 16px;
  }
`;

export function AddExtensionDialog({
  open,
  onClose,
  onAdd,
  allExtensions,
  extensionAddFilter,
  onExtensionAddFilterChange,
  type,
}) {
  const [selectedExtensions, setSelectedExtensions] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <StyledDialog open={open} onClose={onClose}>
      <RcDialogTitle>
        {type === 'User' ? 'Add extensions' : 'Add park locations'}
      </RcDialogTitle>
      <RcDialogContent>
        <RcDownshift
          label={type === 'User' ? 'Contacts' : 'Park location'}
          value={selectedExtensions}
          inputValue={extensionAddFilter}
          onChange={(value) => setSelectedExtensions(value)}
          onInputChange={(value) => onExtensionAddFilterChange(value)}
          options={allExtensions
            .filter((extension) => !selectedExtensions.some((selectedExtension) => selectedExtension.id === extension.id))
            .map((extension) => {
              return {
                id: extension.id,
                label: extension.name,
                extensionNumber: extension.extensionNumber,
                profileImageUrl: extension.profileImageUrl,
              };
            })
          }
          multiple
          fullWidth
          variant="tags"
          placeholder={type === 'User' ? 'Search contacts' : 'Enter name or number'}
          renderOption={({ id, ...item }, state) => (
            <RcMenuItem
              id={id}
              key={`${id}-${state.index}`}
              focused={state.highlighted}
              onClick={item.onClick}
            >
              <RcListItemAvatar>
                <RcAvatar
                  src={item.profileImageUrl}
                  size="xsmall"
                  color="avatar.global"
                >
                  {
                    item.profileImageUrl ? null : (
                      <RcIcon symbol={People} size="small" />
                    )
                  }
                </RcAvatar>
              </RcListItemAvatar>
              <RcListItemText
                primary={item.label}
                secondary={item.extensionNumber ? `Ext.${item.extensionNumber}` : undefined}
              />
            </RcMenuItem>
          )}
        />
      </RcDialogContent>
      <RcDialogActions>
        <RcButton onClick={onClose} variant="text">Cancel</RcButton>
        <RcButton
          onClick={
            async () => {
              try {
                setLoading(true);
                await onAdd(selectedExtensions);
                setLoading(false);
              } catch (e) {
                setLoading(false);
              }
              onClose();
            }
          }
          variant="contained"
        >
          Add
        </RcButton>
      </RcDialogActions>
    </StyledDialog>
  );
}
