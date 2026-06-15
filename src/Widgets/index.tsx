import {
  FormContextType,
  RegistryWidgetsType,
  RJSFSchema,
} from '@rjsf/utils';
import { generateWidgets } from '@ringcentral-integration/rjsf-spring';

import AutocompleteWidget from './AutocompleteWidget';
import CheckboxesWidget from './CheckboxesWidget';
import CheckboxWidget from './CheckboxWidget';
import DateTimeWidget from './DateTimeWidget';
import DateWidget from './DateWidget';
import DurationWidget from './DurationWidget';
import FileWidget from './FileWidget';
import RadioWidget from './RadioWidget';
import RangeWidget from './RangeWidget';
import SelectWidget from './SelectWidget';
import SwitchWidget from './SwitchWidget';
import TextareaWidget from './TextareaWidget';
import TimeWidget from './TimeWidget';

export const widgets = {
  ...generateWidgets(),
  AutocompleteWidget,
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
  TimeWidget,
  checkbox: CheckboxWidget,
  checkboxes: CheckboxesWidget,
  date: DateWidget,
  datetime: DateTimeWidget,
  'date-time': DateTimeWidget,
  duration: DurationWidget,
  file: FileWidget,
  radio: RadioWidget,
  range: RangeWidget,
  select: SelectWidget,
  switch: SwitchWidget,
  textarea: TextareaWidget,
  time: TimeWidget,
  toggle: SwitchWidget,
} as RegistryWidgetsType<any, RJSFSchema, FormContextType>;
