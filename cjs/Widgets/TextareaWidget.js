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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextareaWidget;
const spring_ui_1 = require("@ringcentral/spring-ui");
const react_1 = __importStar(require("react"));
function TextareaWidget(props) {
    const { id, name, value, onChange, onChangeOverride, onBlur, onFocus, options, } = props;
    const handleChange = ({ target: { value: nextValue } }) => {
        onChange(nextValue);
    };
    const handleBlur = ({ target: { value: nextValue }, }) => {
        onBlur(id, nextValue);
    };
    const handleFocus = ({ target: { value: nextValue }, }) => {
        onFocus(id, nextValue);
    };
    const inputProps = (0, react_1.useMemo)(() => (Object.assign({ 'data-sign': name }, props.inputProps)), [name, props.inputProps]);
    return (react_1.default.createElement(spring_ui_1.Textarea, Object.assign({}, props, { inputProps: inputProps, onChange: onChangeOverride || handleChange, onBlur: handleBlur, onFocus: handleFocus, value: value !== null && value !== void 0 ? value : '', minRows: 4, maxRows: 12, rows: options.rows, fullWidth: true, defaultValue: props.defaultValue, clearBtn: false, variant: "outlined", size: "large" })));
}
//# sourceMappingURL=TextareaWidget.js.map