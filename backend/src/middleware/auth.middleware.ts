import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/apiResponse';
import { User, IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json(errorResponse('Not authorized to access this route'));
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as any;
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json(errorResponse('The user belonging to this token does no longer exist.'));
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json(errorResponse('Your account has been deactivated.'));
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json(errorResponse('Not authorized to access this route'));
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json(errorResponse(`User role ${req.user?.role} is not authorized to access this route`));
    }
    next();
  };
};
