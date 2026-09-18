import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  ListItemText,
  Radio,
  RadioGroup,
} from '@ringcentral/spring-ui';
import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';

import type { EndCallDialogProps } from './EndCallDialog.interface';
import i18n from './i18n';

const RADIO_GROUP_NAME = 'endCallOption';

/**
 * EndCallDialog - Asks which parties to drop before ending a multi-party call
 *
 * Purely presentational: the caller supplies the available options and decides
 * what each one does.
 */
export const EndCallDialog: FunctionComponent<EndCallDialogProps> = ({
  open,
  options,
  onClose,
  onConfirm,
}) => {
  const { t } = useLocale(i18n);
  const [selectedId, setSelectedId] = useState('');
  // The agent's own leg is the second option and the least destructive one, so
  // it is preselected the way the RingCentral app does it.
  const defaultId = options[1]?.id ?? options[0]?.id ?? '';

  useEffect(() => {
    if (open) {
      setSelectedId(defaultId);
    }
  }, [open, defaultId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedId(e.target.value);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedId) return;
    onConfirm(selectedId);
  }, [selectedId, onConfirm]);

  if (!open) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} size="small" data-sign="endCallDialog">
      <DialogTitle>
        <span className="typography-display2 text-neutral-b0">
          {t('endCall')}
        </span>
      </DialogTitle>
      <DialogContent>
        <RadioGroup
          name={RADIO_GROUP_NAME}
          value={selectedId}
          onChange={handleChange}
        >
          {options.map(({ id, label, description }) => (
            <FormLabel
              key={id}
              value={id}
              className="py-1"
              classes={{ label: 'typography-mainText text-neutral-b0' }}
              rootProps={{ 'data-sign': `endCallOption-${id}` }}
              // The transfer destination goes on its own line: the dialog is
              // too narrow to keep it on one and still show the whole number.
              label={<ListItemText primary={label} secondary={description} />}
            >
              <Radio />
            </FormLabel>
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button variant="text" onClick={onClose} data-sign="endCallCancel">
          {t('cancel')}
        </Button>
        <Button
          variant="contained"
          color="danger"
          onClick={handleConfirm}
          disabled={!selectedId}
          data-sign="endCallConfirm"
        >
          {t('endCall')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
