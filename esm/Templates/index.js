import { generateTemplates } from '@ringcentral-integration/rjsf-spring';
import ArrayFieldItemTemplate from './ArrayFieldItemTemplate.js';
import ArrayFieldTemplate from './ArrayFieldTemplate.js';
import BaseInputTemplate from './BaseInputTemplate.js';
import DescriptionField from './DescriptionField.js';
import ErrorListTemplate from './ErrorListTemplate.js';
import FieldErrorTemplate from './FieldErrorTemplate.js';
import FieldHelpTemplate from './FieldHelpTemplate.js';
import FieldTemplate from './FieldTemplate.js';
import ObjectFieldTemplate from './ObjectFieldTemplate.js';
import TitleField from './TitleField.js';
export const templates = Object.assign(Object.assign({}, generateTemplates()), { ArrayFieldItemTemplate,
    ArrayFieldTemplate,
    BaseInputTemplate, DescriptionFieldTemplate: DescriptionField, ErrorListTemplate,
    FieldErrorTemplate,
    FieldHelpTemplate,
    FieldTemplate,
    ObjectFieldTemplate, TitleFieldTemplate: TitleField });
export function generateJSONSchemaSpringPageTemplates() {
    return Object.assign(Object.assign({}, generateTemplates()), { ArrayFieldItemTemplate,
        ArrayFieldTemplate,
        BaseInputTemplate, DescriptionFieldTemplate: DescriptionField, ErrorListTemplate,
        FieldErrorTemplate,
        FieldHelpTemplate,
        FieldTemplate,
        ObjectFieldTemplate, TitleFieldTemplate: TitleField });
}
//# sourceMappingURL=index.js.map