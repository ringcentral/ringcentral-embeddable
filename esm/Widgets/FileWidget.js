var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useRef, useState } from 'react';
import { labelValue, } from '@rjsf/utils';
import { IconButton, List, ListItem, ListItemText, Text, } from '@ringcentral/spring-ui';
import { AttachMd, TrashMd } from '@ringcentral/spring-icon';
function addNameToDataURL(dataURL, name) {
    return dataURL.replace(';base64', `;name=${encodeURIComponent(name)};base64`);
}
function processFile(file) {
    const { name, size, type } = file;
    return new Promise((resolve, reject) => {
        const reader = new window.FileReader();
        reader.onerror = reject;
        reader.onload = (event) => {
            var _a;
            if (typeof ((_a = event.target) === null || _a === void 0 ? void 0 : _a.result) === 'string') {
                resolve({
                    dataURL: addNameToDataURL(event.target.result, name),
                    name,
                    size,
                    type,
                });
            }
            else {
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
function formatFileSize(bytes) {
    if (bytes === 0) {
        return '0 Bytes';
    }
    const sizeBase = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const sizeIndex = Math.floor(Math.log(bytes) / Math.log(sizeBase));
    return `${Number.parseFloat((bytes / Math.pow(sizeBase, sizeIndex)).toFixed(2))} ${sizes[sizeIndex]}`;
}
function getFormFieldLabelClassName(hasError) {
    const classNames = [
        'sui-form-field-label',
        'sui-form-field-outlined-label',
    ];
    if (hasError) {
        classNames.push('sui-form-field-error-label');
    }
    return classNames.join(' ');
}
export default function FileWidget(props) {
    const { options, id, label, hideLabel, placeholder, required, readonly, disabled, onChange, value, schema, rawErrors = [], } = props;
    const fileInputRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const multiple = (options === null || options === void 0 ? void 0 : options.multiple) || (schema === null || schema === void 0 ? void 0 : schema.type) === 'array';
    const accept = (options === null || options === void 0 ? void 0 : options.accept) || '*/*';
    const maxSize = Number.parseInt(options === null || options === void 0 ? void 0 : options.maxSize, 10) || 0;
    const files = Array.isArray(value) ? value : value ? [value] : [];
    const fieldLabel = labelValue(label, hideLabel, false);
    const hasError = rawErrors.length > 0;
    const handleFileSelect = (selectedFiles) => __awaiter(this, void 0, void 0, function* () {
        if (!selectedFiles || selectedFiles.length === 0) {
            return;
        }
        setIsLoading(true);
        const newFiles = [];
        for (let index = 0; index < selectedFiles.length; index += 1) {
            const file = selectedFiles[index];
            if (maxSize && file.size > maxSize) {
                continue;
            }
            newFiles.push(yield processFile(file));
        }
        onChange(multiple ? [...files, ...newFiles] : newFiles[0] || null);
        setIsLoading(false);
    });
    const handleFileInputChange = (event) => __awaiter(this, void 0, void 0, function* () {
        yield handleFileSelect(event.target.files);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    });
    const handleRemoveFile = (index) => {
        if (multiple) {
            const nextFiles = files.filter((_, fileIndex) => fileIndex !== index);
            onChange(nextFiles.length > 0 ? nextFiles : null);
            return;
        }
        onChange(null);
    };
    return (React.createElement(React.Fragment, null,
        fieldLabel ? (React.createElement("label", { className: getFormFieldLabelClassName(hasError), htmlFor: id },
            fieldLabel,
            required ? ' *' : '')) : null,
        React.createElement("input", { ref: fileInputRef, id: id, type: "file", accept: accept, multiple: multiple, onChange: handleFileInputChange, disabled: disabled, style: { display: 'none' } }),
        React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            React.createElement(IconButton, { size: "medium", symbol: AttachMd, disabled: disabled || readonly || isLoading, color: "neutral", onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, label: "Choose file" }),
            React.createElement(Text, { className: "typography-mainText" }, (!multiple && files.length > 0) ? files[0].name : (placeholder || 'No file selected.'))),
        multiple && files.length > 0 ? (React.createElement(List, null, files.map((file, index) => (React.createElement(ListItem, { key: `${file.name}-${index}`, hoverActions: (React.createElement(IconButton, { size: "small", onClick: () => handleRemoveFile(index), disabled: disabled || readonly, label: "Remove file", symbol: TrashMd })) },
            React.createElement(ListItemText, { primary: file.name, secondary: `${formatFileSize(file.size)} - ${file.type || 'Unknown type'}` })))))) : null));
}
//# sourceMappingURL=FileWidget.js.map