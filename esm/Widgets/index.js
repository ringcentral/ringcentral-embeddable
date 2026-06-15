import { generateWidgets } from '@ringcentral-integration/rjsf-spring';
import AutocompleteWidget from './AutocompleteWidget.js';
import CheckboxesWidget from './CheckboxesWidget.js';
import CheckboxWidget from './CheckboxWidget.js';
import DateTimeWidget from './DateTimeWidget.js';
import DateWidget from './DateWidget.js';
import DurationWidget from './DurationWidget.js';
import FileWidget from './FileWidget.js';
import RadioWidget from './RadioWidget.js';
import RangeWidget from './RangeWidget.js';
import SelectWidget from './SelectWidget.js';
import SwitchWidget from './SwitchWidget.js';
import TextareaWidget from './TextareaWidget.js';
import TimeWidget from './TimeWidget.js';
export const widgets = Object.assign(Object.assign({}, generateWidgets()), { AutocompleteWidget,
    CheckboxesWidget,
    CheckboxWidget,
    DateTimeWidget,
    DateWidget,
    DurationWidget,
    FileWidget,
    RadioWidget,
    RangeWidget,
    SelectWidget,
    SwitchWidget,
    TextareaWidget,
    TimeWidget, checkbox: CheckboxWidget, checkboxes: CheckboxesWidget, date: DateWidget, datetime: DateTimeWidget, 'date-time': DateTimeWidget, duration: DurationWidget, file: FileWidget, radio: RadioWidget, range: RangeWidget, select: SelectWidget, switch: SwitchWidget, textarea: TextareaWidget, time: TimeWidget, toggle: SwitchWidget });
//# sourceMappingURL=index.js.map