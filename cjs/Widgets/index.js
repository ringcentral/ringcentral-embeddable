"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.widgets = void 0;
const rjsf_spring_1 = require("@ringcentral-integration/rjsf-spring");
const AutocompleteWidget_1 = __importDefault(require("./AutocompleteWidget"));
const CheckboxesWidget_1 = __importDefault(require("./CheckboxesWidget"));
const CheckboxWidget_1 = __importDefault(require("./CheckboxWidget"));
const DateTimeWidget_1 = __importDefault(require("./DateTimeWidget"));
const DateWidget_1 = __importDefault(require("./DateWidget"));
const DurationWidget_1 = __importDefault(require("./DurationWidget"));
const FileWidget_1 = __importDefault(require("./FileWidget"));
const RadioWidget_1 = __importDefault(require("./RadioWidget"));
const RangeWidget_1 = __importDefault(require("./RangeWidget"));
const SelectWidget_1 = __importDefault(require("./SelectWidget"));
const SwitchWidget_1 = __importDefault(require("./SwitchWidget"));
const TextareaWidget_1 = __importDefault(require("./TextareaWidget"));
const TimeWidget_1 = __importDefault(require("./TimeWidget"));
exports.widgets = Object.assign(Object.assign({}, (0, rjsf_spring_1.generateWidgets)()), { AutocompleteWidget: AutocompleteWidget_1.default,
    CheckboxesWidget: CheckboxesWidget_1.default,
    CheckboxWidget: CheckboxWidget_1.default,
    DateTimeWidget: DateTimeWidget_1.default,
    DateWidget: DateWidget_1.default,
    DurationWidget: DurationWidget_1.default,
    FileWidget: FileWidget_1.default,
    RadioWidget: RadioWidget_1.default,
    RangeWidget: RangeWidget_1.default,
    SelectWidget: SelectWidget_1.default,
    SwitchWidget: SwitchWidget_1.default,
    TextareaWidget: TextareaWidget_1.default,
    TimeWidget: TimeWidget_1.default, checkbox: CheckboxWidget_1.default, checkboxes: CheckboxesWidget_1.default, date: DateWidget_1.default, datetime: DateTimeWidget_1.default, 'date-time': DateTimeWidget_1.default, duration: DurationWidget_1.default, file: FileWidget_1.default, radio: RadioWidget_1.default, range: RangeWidget_1.default, select: SelectWidget_1.default, switch: SwitchWidget_1.default, textarea: TextareaWidget_1.default, time: TimeWidget_1.default, toggle: SwitchWidget_1.default });
//# sourceMappingURL=index.js.map