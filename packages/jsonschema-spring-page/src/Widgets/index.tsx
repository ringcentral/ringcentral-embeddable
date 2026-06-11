import {
  FormContextType,
  RegistryWidgetsType,
  RJSFSchema,
} from '@rjsf/utils';
import { generateWidgets } from '@ringcentral-integration/rjsf-spring';

import AutocompleteWidget from './AutocompleteWidget';
import CheckboxesWidget from './CheckboxesWidget';
import CheckboxWidget from './CheckboxWidget';
import DurationWidget from './DurationWidget';
import FileWidget from './FileWidget';
import RadioWidget from './RadioWidget';
import SelectWidget from './SelectWidget';

export const widgets = {
  ...generateWidgets(),
  AutocompleteWidget,
  CheckboxesWidget,
  CheckboxWidget,
  DurationWidget,
  FileWidget,
  RadioWidget,
  SelectWidget,
  checkbox: CheckboxWidget,
  checkboxes: CheckboxesWidget,
  duration: DurationWidget,
  file: FileWidget,
  radio: RadioWidget,
  select: SelectWidget,
} as RegistryWidgetsType<any, RJSFSchema, FormContextType>;
