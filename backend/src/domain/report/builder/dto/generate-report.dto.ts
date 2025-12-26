import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ArrayMaxSize,
  ValidateNested,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Helper function to validate individual filter values
 * Prevents injection attacks by validating value types and content
 */
function isValidFilterValue(val: unknown): boolean {
  if (val === null || val === undefined) {
    return true;
  }
  if (typeof val === 'string') {
    // Max 1000 chars for string values, no dangerous patterns
    return val.length <= 1000 && !/[<>{}]/.test(val);
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return true;
  }
  if (Array.isArray(val)) {
    // Max 100 items in array, each item must be valid
    return val.length <= 100 && val.every((item) => isValidFilterValue(item));
  }
  // Date strings
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    return true;
  }
  // Nested objects for date ranges etc
  if (typeof val === 'object' && val !== null) {
    const objVal = val as Record<string, unknown>;
    return Object.keys(objVal).length <= 10 &&
      Object.values(objVal).every((v) => isValidFilterValue(v));
  }
  return false;
}

/**
 * Custom validator to sanitize filter values
 * Prevents injection attacks and validates filter structure
 */
function IsSafeFilters(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isSafeFilters',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined) {
            return true;
          }
          if (typeof value !== 'object' || Array.isArray(value)) {
            return false;
          }

          // Validate each filter key and value
          for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            // Validate key: alphanumeric with underscores/hyphens, max 50 chars
            if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,49}$/.test(key)) {
              return false;
            }

            // Validate value types (string, number, boolean, array, date string)
            if (!isValidFilterValue(val)) {
              return false;
            }
          }
          return true;
        },

        defaultMessage(args: ValidationArguments) {
          return 'Filters contain invalid or potentially unsafe values';
        },
      },
    });
  };
}

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, { message: 'Report type must be at most 100 characters' })
  @Transform(({ value }) => value?.trim())
  type: string;

  @IsArray()
  @IsOptional()
  @ArrayMaxSize(100, { message: 'Maximum 100 columns allowed' })
  @IsString({ each: true, message: 'Each column must be a string' })
  @MaxLength(100, { each: true, message: 'Each column name must be at most 100 characters' })
  columns?: string[];

  @IsObject()
  @IsOptional()
  @IsSafeFilters({ message: 'Filters contain invalid or potentially unsafe values' })
  filters?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'GroupBy field must be at most 100 characters' })
  groupBy?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'SortBy field must be at most 100 characters' })
  sortBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @IsIn(['excel', 'csv', 'pdf', 'json'])
  @IsOptional()
  format?: string;
}
