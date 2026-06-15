import React, { ChangeEvent, useRef, useState } from 'react';
import {
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import {
  IconButton,
  List,
  ListItem,
  ListItemText,
  Text,
} from '@ringcentral/spring-ui';
import { AttachMd, TrashMd } from '@ringcentral/spring-icon';

type FileInfoType = {
  dataURL?: string | null;
  name: string;
  size: number;
  type: string;
};

function addNameToDataURL(dataURL: string, name: string): string {
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

function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }
  const sizeBase = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const sizeIndex = Math.floor(Math.log(bytes) / Math.log(sizeBase));
  return `${Number.parseFloat((bytes / Math.pow(sizeBase, sizeIndex)).toFixed(2))} ${sizes[sizeIndex]}`;
}

function getFormFieldLabelClassName(hasError: boolean): string {
  const classNames = [
    'sui-form-field-label',
    'sui-form-field-outlined-label',
  ];
  if (hasError) {
    classNames.push('sui-form-field-error-label');
  }
  return classNames.join(' ');
}

export default function FileWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
    rawErrors = [],
  } = props;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const multiple = options?.multiple || schema?.type === 'array';
  const accept = options?.accept || '*/*';
  const maxSize = Number.parseInt(options?.maxSize as string, 10) || 0;
  const files: FileInfoType[] = Array.isArray(value) ? value : value ? [value] : [];
  const fieldLabel = labelValue(label, hideLabel, false);
  const hasError = rawErrors.length > 0;
  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    setIsLoading(true);
    const newFiles: FileInfoType[] = [];
    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];
      if (maxSize && file.size > maxSize) {
        continue;
      }
      newFiles.push(await processFile(file));
    }
    onChange(multiple ? [...files, ...newFiles] : newFiles[0] || null);
    setIsLoading(false);
  };
  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    await handleFileSelect(event.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const handleRemoveFile = (index: number) => {
    if (multiple) {
      const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);
      onChange(nextFiles.length > 0 ? nextFiles : null);
      return;
    }
    onChange(null);
  };
  return (
    <>
      {fieldLabel ? (
        <label
          className={getFormFieldLabelClassName(hasError)}
          htmlFor={id}
        >
          {fieldLabel}
          {required ? ' *' : ''}
        </label>
      ) : null}
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept as string}
        multiple={multiple as boolean}
        onChange={handleFileInputChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IconButton
          size="medium"
          symbol={AttachMd}
          disabled={disabled || readonly || isLoading}
          color="neutral"
          onClick={() => fileInputRef.current?.click()}
          label="Choose file"
        />
        <Text className="typography-mainText">
          {(!multiple && files.length > 0) ? files[0].name : (placeholder || 'No file selected.')}
        </Text>
      </div>
      {multiple && files.length > 0 ? (
        <List>
          {files.map((file, index) => (
            <ListItem
              key={`${file.name}-${index}`}
              hoverActions={(
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFile(index)}
                  disabled={disabled || readonly}
                  label="Remove file"
                  symbol={TrashMd}
                />
              )}
            >
              <ListItemText
                primary={file.name}
                secondary={`${formatFileSize(file.size)} - ${file.type || 'Unknown type'}`}
              />
            </ListItem>
          ))}
        </List>
      ) : null}
    </>
  );
}
