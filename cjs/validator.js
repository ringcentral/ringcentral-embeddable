"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Validator = void 0;
class Validator {
    constructor() {
        this.emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    }
    validateFormData(formData, schema) {
        const errors = [];
        const errorSchema = {};
        this._validateObject(formData, schema, [], errors, errorSchema);
        return {
            errors,
            errorSchema,
        };
    }
    isValid(schema, formData, rootSchema) {
        const result = this.validateFormData(formData, schema);
        return result.errors.length === 0;
    }
    rawValidation(schema, formData) {
        const result = this.validateFormData(formData, schema);
        return {
            errors: result.errors,
            validationError: result.errors.length > 0 ? new Error('Validation failed') : undefined,
        };
    }
    toErrorList(errorSchema, fieldPath = []) {
        const errors = [];
        if (!errorSchema) {
            return errors;
        }
        Object.keys(errorSchema).forEach(key => {
            const error = errorSchema[key];
            const currentPath = [...fieldPath, key];
            if (error.__errors) {
                error.__errors.forEach((errorMsg) => {
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
    _validateObject(data, schema, path, errors, errorSchema) {
        if (!schema)
            return;
        // Handle required fields validation
        if (schema.required && Array.isArray(schema.required)) {
            schema.required.forEach((field) => {
                if (this._isEmpty(data === null || data === void 0 ? void 0 : data[field])) {
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
    _validateField(value, schema, path, errors, errorSchema) {
        if (!schema)
            return;
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
    _validateType(value, expectedType) {
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
    _validateFormat(value, format) {
        switch (format) {
            case 'email':
                return this.emailRegex.test(value) ? null : 'Must be a valid email address';
            case 'date':
                return this._isValidDate(value) ? null : 'Must be a valid date (YYYY-MM-DD)';
            case 'time':
                return this._isValidTime(value) ? null : 'Must be a valid time (HH:MM or HH:MM:SS)';
            case 'date-time':
                return this._isValidDateTime(value) ? null : 'Must be a valid date-time';
            case 'duration':
                return this._isValidDuration(value) ? null : 'Must be a valid duration (for example PT1H30M)';
            case 'uri':
                return this._isValidUri(value) ? null : 'Must be a valid URI';
            case 'uuid':
                return this._isValidUuid(value) ? null : 'Must be a valid UUID';
            default:
                return null;
        }
    }
    _isValidDate(value) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(value))
            return false;
        const date = new Date(value + 'T00:00:00.000Z'); // Add time to avoid timezone issues
        return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().startsWith(value);
    }
    _isValidDateTime(value) {
        const date = new Date(value);
        return date instanceof Date && !isNaN(date.getTime());
    }
    _isValidTime(value) {
        const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/;
        return timeRegex.test(value);
    }
    _isValidDuration(value) {
        const durationRegex = /^P(?=\d|T\d)(?:(\d+)D)?(?:T(?=\d)(?:(\d+)H)?(?:(\d+)M)?)?$/i;
        return durationRegex.test(value);
    }
    _isValidUri(value) {
        try {
            new URL(value);
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    _isValidUuid(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
    _isEmpty(value) {
        if (value === undefined || value === null)
            return true;
        if (typeof value === 'string' && value.trim() === '')
            return true;
        if (Array.isArray(value) && value.length === 0)
            return true;
        // Don't consider empty objects as empty for validation purposes
        // The schema should define if an object is required or not
        return false;
    }
    _addError(errors, errorSchema, path, message) {
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
            }
            else {
                // Intermediate key - create nested structure
                if (!current[key]) {
                    current[key] = {};
                }
                current = current[key];
            }
        }
    }
    reset() {
        // Reset any internal state if needed
    }
}
exports.Validator = Validator;
//# sourceMappingURL=validator.js.map