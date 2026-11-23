import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { z } from 'zod';

/** Small zod-4 resolver: first issue per field wins; the parsed value is returned on success. */
export function zodFormResolver<TValues extends FieldValues>(schema: z.ZodType<TValues>): Resolver<TValues> {
  return (values) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: Record<string, { type: string; message: string }> = {};

    for (const issue of result.error.issues) {
      const field = issue.path.join('.');

      if (field.length > 0 && errors[field] === undefined) {
        errors[field] = { type: issue.code, message: issue.message };
      }
    }

    return { values: {}, errors: errors as FieldErrors<TValues> };
  };
}
