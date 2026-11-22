import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

export function submitSchemaValidatedForm<TFormValues extends FieldValues>(
  form: UseFormReturn<TFormValues>,
  schema: z.ZodType<TFormValues>,
  values: TFormValues,
  onValid: (parsedValues: TFormValues) => void
): void {
  form.clearErrors();

  const validationResult = schema.safeParse(values);

  if (!validationResult.success) {
    for (const issue of validationResult.error.issues) {
      const fieldName = issue.path[0];

      if (typeof fieldName === 'string') {
        form.setError(fieldName as Path<TFormValues>, {
          type: 'manual',
          message: issue.message
        });
      }
    }

    return;
  }

  onValid(validationResult.data);
}
