import { ZodError } from 'zod';
export function validate(schema) {
    return async (req, res, next) => {
        try {
            const parsed = await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Replace with sanitized/parsed types
            if (parsed.body)
                req.body = parsed.body;
            if (parsed.query)
                req.query = parsed.query;
            if (parsed.params)
                req.params = parsed.params;
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors.map((e) => ({
                        field: e.path.slice(1).join('.') || e.path.join('.'),
                        message: e.message,
                    })),
                });
                return;
            }
            next(error);
        }
    };
}
