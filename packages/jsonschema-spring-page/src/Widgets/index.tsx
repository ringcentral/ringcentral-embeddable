import {
  FormContextType,
  RegistryWidgetsType,
  RJSFSchema,
} from '@rjsf/utils';
import { generateWidgets } from '@ringcentral-integration/rjsf-spring';

import AutocompleteWidget from './AutocompleteWidget';
import CheckboxesWidget from './CheckboxesWidget';
import BooleanCheckboxWidget from './CheckboxWidget';
import DateTimeWidget from './DateTimeWidget';
import DateWidget from './DateWidget';
import DurationWidget from './DurationWidget';
import FileWidget from './FileWidget';
import RadioWidget from './RadioWidget';
import SelectWidget from './SelectWidget';
import SwitchWidget from './SwitchWidget';
import TimeWidget from './TimeWidget';

export const widgets = {
  ...generateWidgets(),
  AutocompleteWidget,
  BooleanCheckboxWidget,
  CheckboxesWidget,
  CheckboxWidget: SwitchWidget,
  DateTimeWidget,
  DateWidget,
  DurationWidget,
  FileWidget,
  RadioWidget,
  SelectWidget,
  SwitchWidget,
  TimeWidget,
  booleanCheckbox: BooleanCheckboxWidget,
  checkbox: SwitchWidget,
  checkboxes: CheckboxesWidget,
  date: DateWidget,
  datetime: DateTimeWidget,
  'date-time': DateTimeWidget,
  duration: DurationWidget,
  file: FileWidget,
  radio: RadioWidget,
  select: SelectWidget,
  switch: SwitchWidget,
  time: TimeWidget,
  toggle: SwitchWidget,
} as RegistryWidgetsType<any, RJSFSchema, FormContextType>;
