import { ValidatorType, ErrorSchema, RJSFValidationError } from '@rjsf/utils';
export declare class Validator implements ValidatorType {
    private emailRegex;
    validateFormData(formData: any, schema: any): {
        errors: RJSFValidationError[];
        errorSchema: ErrorSchema;
    };
    isValid(schema: any, formData: any, rootSchema?: any): boolean;
    rawValidation<Result = any>(schema: any, formData?: any): {
        errors?: Result[];
        validationError?: Error;
    };
    toErrorList(errorSchema: ErrorSchema, fieldPath?: string[]): RJSFValidationError[];
    private _validateObject;
    private _validateField;
    private _validateType;
    private _validateFormat;
    private _isValidDate;
    private _isValidDateTime;
    private _isValidTime;
    private _isValidDuration;
    private _isValidUri;
    private _isValidUuid;
    private _isEmpty;
    private _addError;
    reset(): void;
}
//# sourceMappingURL=validator.d.ts.map