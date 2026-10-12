import { ValidationError } from '../errors/errorTypes.js';

export function validate(schema) {
  return (req, res, next) => {

   
console.log('req.body:', req.body);
console.log('content-type:', req.headers['content-type']);

    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {

      

      const errors = result.error.issues.map((issue) => ({
        field: issue.path.slice(1).join('.'),
        message: issue.message,
      }));

      return next(
        new ValidationError('Validation failed', errors),
      );
    }

    

    if (result.data.body && req.body) {
      Object.assign(req.body, result.data.body);
    }

    if (result.data.params && req.params) {
      Object.assign(req.params, result.data.params);
    }

    // Express 5 req.query can sometimes be getter-based,
    // so only mutate if it exists and is an object.
    if (
      result.data.query &&
      req.query &&
      typeof req.query === 'object'
    ) {
      Object.assign(req.query, result.data.query);
    }

    next();
  };
}