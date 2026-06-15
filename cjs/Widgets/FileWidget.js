"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FileWidget;
const react_1 = __importStar(require("react"));
const utils_1 = require("@rjsf/utils");
const spring_ui_1 = require("@ringcentral/spring-ui");
const spring_icon_1 = require("@ringcentral/spring-icon");
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
function FileWidget(props) {
    const { options, id, label, hideLabel, placeholder, required, readonly, disabled, onChange, value, schema, rawErrors = [], } = props;
    const fileInputRef = (0, react_1.useRef)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const multiple = (options === null || options === void 0 ? void 0 : options.multiple) || (schema === null || schema === void 0 ? void 0 : schema.type) === 'array';
    const accept = (options === null || options === void 0 ? void 0 : options.accept) || '*/*';
    const maxSize = Number.parseInt(options === null || options === void 0 ? void 0 : options.maxSize, 10) || 0;
    const files = Array.isArray(value) ? value : value ? [value] : [];
    const fieldLabel = (0, utils_1.labelValue)(label, hideLabel, false);
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
    return (react_1.default.createElement(react_1.default.Fragment, null,
        fieldLabel ? (react_1.default.createElement("label", { className: getFormFieldLabelClassName(hasError), htmlFor: id },
            fieldLabel,
            required ? ' *' : '')) : null,
        react_1.default.createElement("input", { ref: fileInputRef, id: id, type: "file", accept: accept, multiple: multiple, onChange: handleFileInputChange, disabled: disabled, style: { display: 'none' } }),
        react_1.default.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            react_1.default.createElement(spring_ui_1.IconButton, { size: "medium", symbol: spring_icon_1.AttachMd, disabled: disabled || readonly || isLoading, color: "neutral", onClick: () => { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, label: "Choose file" }),
            react_1.default.createElement(spring_ui_1.Text, { className: "typography-mainText" }, (!multiple && files.length > 0) ? files[0].name : (placeholder || 'No file selected.'))),
        multiple && files.length > 0 ? (react_1.default.createElement(spring_ui_1.List, null, files.map((file, index) => (react_1.default.createElement(spring_ui_1.ListItem, { key: `${file.name}-${index}`, hoverActions: (react_1.default.createElement(spring_ui_1.IconButton, { size: "small", onClick: () => handleRemoveFile(index), disabled: disabled || readonly, label: "Remove file", symbol: spring_icon_1.TrashMd })) },
            react_1.default.createElement(spring_ui_1.ListItemText, { primary: file.name, secondary: `${formatFileSize(file.size)} - ${file.type || 'Unknown type'}` })))))) : null));
}
//# sourceMappingURL=FileWidget.js.map