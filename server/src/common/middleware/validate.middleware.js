/**
 * Express middleware generator that validates incoming request data using Zod.
 * Stores validated and sanitized data on `req.validated` and passes any ZodError to next().
 *
 * @param {import('zod').ZodSchema} schema - The Zod schema to validate against
 * @param {'body' | 'query' | 'params'} [target='body'] - Which request property to validate
 * @returns {import('express').RequestHandler}
 */
export function validate(schema, target = 'body') {
  return (req, res, next) => {
    try {
      const sourceData = req[target] ?? {};
      const validatedData = schema.parse(sourceData);

      if (!req.validated) {
        req.validated = {};
      }

      // Populate both target namespace and merged root for convenient controller access
      req.validated[target] = validatedData;
      Object.assign(req.validated, validatedData);

      next();
    } catch (error) {
      next(error);
    }
  };
}
