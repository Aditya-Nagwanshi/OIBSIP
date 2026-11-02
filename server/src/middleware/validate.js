import { HttpError } from '../utils/httpError.js';

export function parseBody(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(422, 'Please check the highlighted fields.', {
      errors: result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    }, 'VALIDATION_ERROR');
  }
  return result.data;
}
