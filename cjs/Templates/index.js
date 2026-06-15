"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templates = void 0;
exports.generateJSONSchemaSpringPageTemplates = generateJSONSchemaSpringPageTemplates;
const rjsf_spring_1 = require("@ringcentral-integration/rjsf-spring");
const ArrayFieldItemTemplate_1 = __importDefault(require("./ArrayFieldItemTemplate"));
const ArrayFieldTemplate_1 = __importDefault(require("./ArrayFieldTemplate"));
const BaseInputTemplate_1 = __importDefault(require("./BaseInputTemplate"));
const DescriptionField_1 = __importDefault(require("./DescriptionField"));
const ErrorListTemplate_1 = __importDefault(require("./ErrorListTemplate"));
const FieldErrorTemplate_1 = __importDefault(require("./FieldErrorTemplate"));
const FieldHelpTemplate_1 = __importDefault(require("./FieldHelpTemplate"));
const FieldTemplate_1 = __importDefault(require("./FieldTemplate"));
const ObjectFieldTemplate_1 = __importDefault(require("./ObjectFieldTemplate"));
const TitleField_1 = __importDefault(require("./TitleField"));
exports.templates = Object.assign(Object.assign({}, (0, rjsf_spring_1.generateTemplates)()), { ArrayFieldItemTemplate: ArrayFieldItemTemplate_1.default,
    ArrayFieldTemplate: ArrayFieldTemplate_1.default,
    BaseInputTemplate: BaseInputTemplate_1.default, DescriptionFieldTemplate: DescriptionField_1.default, ErrorListTemplate: ErrorListTemplate_1.default,
    FieldErrorTemplate: FieldErrorTemplate_1.default,
    FieldHelpTemplate: FieldHelpTemplate_1.default,
    FieldTemplate: FieldTemplate_1.default,
    ObjectFieldTemplate: ObjectFieldTemplate_1.default, TitleFieldTemplate: TitleField_1.default });
function generateJSONSchemaSpringPageTemplates() {
    return Object.assign(Object.assign({}, (0, rjsf_spring_1.generateTemplates)()), { ArrayFieldItemTemplate: ArrayFieldItemTemplate_1.default,
        ArrayFieldTemplate: ArrayFieldTemplate_1.default,
        BaseInputTemplate: BaseInputTemplate_1.default, DescriptionFieldTemplate: DescriptionField_1.default, ErrorListTemplate: ErrorListTemplate_1.default,
        FieldErrorTemplate: FieldErrorTemplate_1.default,
        FieldHelpTemplate: FieldHelpTemplate_1.default,
        FieldTemplate: FieldTemplate_1.default,
        ObjectFieldTemplate: ObjectFieldTemplate_1.default, TitleFieldTemplate: TitleField_1.default });
}
//# sourceMappingURL=index.js.map