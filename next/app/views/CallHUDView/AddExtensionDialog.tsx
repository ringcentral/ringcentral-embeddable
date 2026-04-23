import { ContactAvatar } from '@ringcentral-integration/micro-contacts/src/app/components';
import {
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
} from '@ringcentral/spring-ui';
import React, { useEffect, useState } from 'react';

import type { AvailableExtension } from './CallHUD.view.interface';
import { t } from './i18n';

export function AddExtensionContent({
  allExtensions,
  type,
  onFilterChange,
  onSelectionChange,
}: {
  allExtensions: AvailableExtension[];
  type: string;
  onFilterChange: (value: string) => void;
  onSelectionChange: (extensions: AvailableExtension[]) => void;
}) {
  const [filterInput, setFilterInput] = useState('');
  const [selectedExtensions, setSelectedExtensions] = useState<
    AvailableExtension[]
  >([]);

  useEffect(() => {
    onFilterChange(filterInput);
  }, [filterInput]);

  const filteredExtensions = allExtensions.filter(
    (ext) => !selectedExtensions.some((sel) => sel.id === ext.id),
  );

  const toggleExtension = (ext: AvailableExtension) => {
    setSelectedExtensions((prev) => {
      const next = prev.some((s) => s.id === ext.id)
        ? prev.filter((s) => s.id !== ext.id)
        : [...prev, ext];
      onSelectionChange(next);
      return next;
    });
  };

  return (
    <div data-sign="addExtensionDialog">
      <TextField
        className="w-full mb-3"
        size="medium"
        placeholder={
          type === 'User' ? t('searchContacts') : t('enterNameOrNumber')
        }
        value={filterInput}
        onChange={(e) => setFilterInput(e.target.value)}
        autoFocus
        data-sign="addExtensionSearchInput"
      />
      {selectedExtensions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {selectedExtensions.map((ext) => (
            <Button
              key={ext.id}
              size="small"
              variant="outlined"
              onClick={() => toggleExtension(ext)}
            >
              {ext.name || ext.extensionNumber} ×
            </Button>
          ))}
        </div>
      )}
      <div className="max-h-48 overflow-y-auto">
        <List>
          {filteredExtensions.map((ext) => (
            <ListItem
              key={ext.id}
              data-sign={`addExtensionOption-${ext.id}`}
              hoverable
              onClick={() => toggleExtension(ext)}
            >
              <div className="mr-3">
                <ContactAvatar
                  url={ext.profileImageUrl}
                  contactName={ext.name}
                  size="xsmall"
                />
              </div>
              <ListItemText
                primary={ext.name}
                secondary={
                  ext.extensionNumber
                    ? `Ext.${ext.extensionNumber}`
                    : undefined
                }
              />
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
}
