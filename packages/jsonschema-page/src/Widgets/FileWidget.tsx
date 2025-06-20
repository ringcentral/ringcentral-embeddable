import React, { ChangeEvent, useRef, useState } from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  labelValue,
} from '@rjsf/utils';
import {
  RcIconButton as IconButton,
  RcTypography as Typography,
  styled,
  RcBox as Box,
  RcFormLabel as FormLabel,
  RcList as List,
  RcListItem as ListItem,
  RcListItemText as ListItemText,
  RcListItemSecondaryAction as ListItemSecondaryAction,
} from '@ringcentral/juno';
import { Attachment, Delete } from '@ringcentral/juno-icon';

const StyledFileInput = styled.input`
  display: none;
`;

type FileInfoType = {
  dataURL?: string | null;
  name: string;
  size: number;
  type: string;
};

const StyledFormLabel = styled(FormLabel)`
  font-size: 0.75rem;
`;

function addNameToDataURL(dataURL: string, name: string) {
  if (dataURL === null) {
    return null;
  }
  return dataURL.replace(';base64', `;name=${encodeURIComponent(name)};base64`);
}

function processFile(file: File): Promise<FileInfoType> {
  const { name, size, type } = file;
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader();
    reader.onerror = reject;
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        resolve({
          dataURL: addNameToDataURL(event.target.result, name),
          name,
          size,
          type,
        });
      } else {
        resolve({
          dataURL: null,
          name,
          size,
          type,
        });
      }
    };
    reader.readAsDataURL(file);
  });
}

export default function FileWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    options,
    id,
    label,
    hideLabel,
    placeholder,
    required,
    readonly,
    disabled,
    onChange,
    value,
    schema,
  } = props;

  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get widget options
  const multiple = options?.multiple || schema?.type === 'array';
  const accept = options?.accept || '*/*';
  const maxSize = Number.parseInt(options?.maxSize as string) || 0;

  // Normalize value to always be an array for easier handling
  const files: FileInfoType[] = Array.isArray(value) ? value : value ? [value] : [];

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsLoading(true);
    const newFiles: FileInfoType[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Check file size if maxSize is specified
      if (maxSize && file.size > maxSize) {
        continue; // Skip files that are too large
      }

      const fileData = await processFile(file);

      newFiles.push(fileData);
    }

    let newValue;
    if (multiple) {
      newValue = [...files, ...newFiles];
    } else {
      newValue = newFiles[0] || null;
    }

    onChange(newValue);
    setIsLoading(false);
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    if (multiple) {
      const newFiles = files.filter((_, i) => i !== index);
      onChange(newFiles.length > 0 ? newFiles : null);
    } else {
      onChange(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      {labelValue(
        <StyledFormLabel required={required} htmlFor={id}>
          {label || undefined}
        </StyledFormLabel>,
        hideLabel
      )}
      <StyledFileInput
        ref={fileInputRef}
        type="file"
        accept={accept as string}
        multiple={multiple as boolean}
        onChange={handleFileInputChange}
        disabled={disabled}
      />
      <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
        <IconButton
          size="medium"
          symbol={Attachment}
          disabled={disabled || readonly || isLoading}
          loading={isLoading}
          color="neutral.f06"
          onClick={() => {
            if (fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        />
        <Typography variant="body1" color="neutral.f06">
          {(!multiple && files.length > 0) ? files[0].name : (placeholder || 'No file selected.')}
        </Typography>
      </Box>

      {multiple && files.length > 0 && (
        <List dense>
          {files.map((file, index) => (
            <ListItem key={`${file.name}-${index}`}>
              <ListItemText
                primary={file.name}
                secondary={`${formatFileSize(file.size)} • ${file.type || 'Unknown type'}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFile(index)}
                  disabled={disabled || readonly}
                  title="Remove file"
                  symbol={Delete}
                />
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
}
