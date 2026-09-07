import { Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { AppError } from '@/common/errors/AppError';
import { ErrorCode } from '@/common/errors/error-codes';

type RequestPart = 'body' | 'query' | 'params';

/**
 * Request validation middleware using class-validator + class-transformer.
 * Validates the specified request part against a DTO class.
 * Returns 422 with field-level validation errors.
 */
export function validateRequest(
  DtoClass: any,
  part: RequestPart = 'body',
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const instance = plainToInstance(DtoClass, req[part], {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    const errors: ValidationError[] = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      const formattedErrors = formatValidationErrors(errors);
      const error = new AppError(
        422,
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        formattedErrors,
      );
      return next(error);
    }

    // Replace request part with the validated/transformed instance
    (req as any)[part] = instance;
    next();
  };
}

function formatValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const propertyPath = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      result[propertyPath] = Object.values(error.constraints);
    }

    if (error.children && error.children.length > 0) {
      const childErrors = formatValidationErrors(error.children, propertyPath);
      Object.assign(result, childErrors);
    }
  }

  return result;
}
