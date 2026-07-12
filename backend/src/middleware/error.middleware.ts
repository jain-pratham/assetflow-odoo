import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/apiResponse';

// Minimal logger for now
export const logger = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg: string, err?: any) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err || ''),
  warn: (msg: string) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`${req.method} ${req.url} - ${err.message}`, err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json(errorResponse(message, process.env.NODE_ENV === 'development' ? err.stack : undefined));
};

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json(errorResponse(`Route not found: ${req.method} ${req.url}`));
};
