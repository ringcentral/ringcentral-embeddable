import { ValidatorType, ErrorSchema, RJSFValidationError } from '@rjsf/utils';

export class Validator implements ValidatorType {
  private emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  validateFormData(formData: any, schema: any): { errors: RJSFValidationError[]; errorSchema: ErrorSchema } {
    const errors: RJSFValidationError[] = [];
    const errorSchema: ErrorSchema = {};

    this._validateObject(formData, schema, [], errors, errorSchema);

    return {
      errors,
      errorSchema,
    };
  }

  isValid(schema: any, formData: any, rootSchema?: any): boolean {
    const result = this.validateFormData(formData, schema);
    return result.errors.length === 0;
  }

  rawValidation<Result = any>(schema: any, formData?: any): { errors?: Result[]; validationError?: Error } {
    const result = this.validateFormData(formData, schema);
    return {
      errors: result.errors as Result[],
      validationError: result.errors.length > 0 ? new Error('Validation failed') : undefined,
    };
  }

  toErrorList(errorSchema: ErrorSchema, fieldPath: string[] = []): RJSFValidationError[] {
    const errors: RJSFValidationError[] = [];
    
    if (!errorSchema) {
      return errors;
    }

    Object.keys(errorSchema).forEach(key => {
      const error = errorSchema[key];
      const currentPath = [...fieldPath, key];
      
      if (error.__errors) {
        error.__errors.forEach((errorMsg: string) => {
          errors.push({
            name: currentPath.join('.'),
            message: errorMsg,
            params: {},
            schemaPath: currentPath.join('.'),
            property: currentPath.join('.'),
            stack: `${currentPath.join('.')}: ${errorMsg}`,
          });
        });
      }
      
      if (typeof error === 'object' && error !== null && !Array.isArray(error) && key !== '__errors') {
        errors.push(...this.toErrorList(error, currentPath));
      }
    });

    return errors;
  }

  private _validateObject(data: any, schema: any, path: string[], errors: RJSFValidationError[], errorSchema: ErrorSchema): void {
    if (!schema) return;

    // Handle required fields validation
    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach((field: string) => {
        if (this._isEmpty(data?.[field])) {
          this._addError(errors, errorSchema, [...path, field], `This field is required`);
        }
      });
    }

    // Handle object properties validation - validate if schema has properties, regardless of type
    if (schema.properties && data && typeof data === 'object' && !Array.isArray(data)) {
      Object.keys(schema.properties).forEach(key => {
        const fieldSchema = schema.properties[key];
        const fieldValue = data[key];
        const fieldPath = [...path, key];

        this._validateField(fieldValue, fieldSchema, fieldPath, errors, errorSchema);
      });
    }

    // Handle array validation
    if (schema.type === 'array' && schema.items && Array.isArray(data)) {
      data.forEach((item, index) => {
        const itemPath = [...path, index.toString()];
        this._validateField(item, schema.items, itemPath, errors, errorSchema);
      });
    }
  }

  private _validateField(value: any, schema: any, path: string[], errors: RJSFValidationError[], errorSchema: ErrorSchema): void {
    if (!schema) return;

    // Type validation
    if (schema.type && !this._validateType(value, schema.type)) {
      const actualType = Array.isArray(value) ? 'array' : (value === null ? 'null' : typeof value);
      this._addError(errors, errorSchema, path, `Expected ${schema.type} but received ${actualType}`);
      return;
    }

    // Format validation (email, date, etc.) - only for non-empty string values
    if (schema.format && typeof value === 'string' && value !== '') {
      const formatError = this._validateFormat(value, schema.format);
      if (formatError) {
        this._addError(errors, errorSchema, path, formatError);
      }
    }

    // String validations
    if (schema.type === 'string' && typeof value === 'string') {
      // Min/Max length validation
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        this._addError(errors, errorSchema, path, `Must be at least ${schema.minLength} characters long`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        this._addError(errors, errorSchema, path, `Must be no more than ${schema.maxLength} characters long`);
      }

      // Pattern validation
      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(value)) {
          this._addError(errors, errorSchema, path, `Does not match the required pattern`);
        }
      }
    }

    // Number validations
    if ((schema.type === 'number' || schema.type === 'integer') && typeof value === 'number') {
      if (schema.minimum !== undefined && value < schema.minimum) {
        this._addError(errors, errorSchema, path, `Must be greater than or equal to ${schema.minimum}`);
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        this._addError(errors, errorSchema, path, `Must be less than or equal to ${schema.maximum}`);
      }
    }

    // Enum validation
    if (schema.enum && !schema.enum.includes(value)) {
      this._addError(errors, errorSchema, path, `Must be one of: ${schema.enum.join(', ')}`);
    }

    // Recursive validation for objects and arrays
    if ((schema.type === 'object' || schema.properties) && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      this._validateObject(value, schema, path, errors, errorSchema);
    }

    if (schema.type === 'array' && Array.isArray(value) && schema.items) {
      value.forEach((item, index) => {
        this._validateField(item, schema.items, [...path, index.toString()], errors, errorSchema);
      });
    }
  }

  private _validateType(value: any, expectedType: string): boolean {
    if (typeof value === 'undefined') {
      return true; // undefined is valid for all types
    }
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'integer':
        return typeof value === 'number' && Number.isInteger(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'null':
        return value === null;
      default:
        return true;
    }
  }

  private _validateFormat(value: string, format: string): string | null {
    switch (format) {
      case 'email':
        return this.emailRegex.test(value) ? null : 'Must be a valid email address';
      case 'date':
        return this._isValidDate(value) ? null : 'Must be a valid date (YYYY-MM-DD)';
      case 'date-time':
        return this._isValidDateTime(value) ? null : 'Must be a valid date-time';
      case 'uri':
        return this._isValidUri(value) ? null : 'Must be a valid URI';
      case 'uuid':
        return this._isValidUuid(value) ? null : 'Must be a valid UUID';
      default:
        return null;
    }
  }

  private _isValidDate(value: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) return false;
    const date = new Date(value + 'T00:00:00.000Z'); // Add time to avoid timezone issues
    return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }

  private _isValidDateTime(value: string): boolean {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private _isValidUri(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  private _isValidUuid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private _isEmpty(value: any): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    // Don't consider empty objects as empty for validation purposes
    // The schema should define if an object is required or not
    return false;
  }

  private _addError(
    errors: RJSFValidationError[], 
    errorSchema: ErrorSchema, 
    path: string[], 
    message: string
  ): void {
    const fieldName = path.join('.');
    
    // Add to errors array
    errors.push({
      name: fieldName,
      message,
      params: {},
      schemaPath: fieldName,
      property: fieldName,
      stack: `${fieldName}: ${message}`,
    });

    // Add to errorSchema
    let current = errorSchema;
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      if (i === path.length - 1) {
        // Last key - add the error
        if (!current[key]) {
          current[key] = {};
        }
        if (!current[key].__errors) {
          current[key].__errors = [];
        }
        current[key].__errors.push(message);
      } else {
        // Intermediate key - create nested structure
        if (!current[key]) {
          current[key] = {};
        }
        current = current[key];
      }
    }
  }

  reset(): void {
    // Reset any internal state if needed
  }
}