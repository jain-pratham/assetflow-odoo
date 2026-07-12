import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../utils/apiResponse';

export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = (error as any).errors || (error as any).issues || [];
        const formatted = errors.map((e: any) => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json(errorResponse('Validation Error', formatted));
      }
      return res.status(400).json(errorResponse('Validation Error', error));
    }
  };
};
