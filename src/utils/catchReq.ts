import { Request, Response, NextFunction } from 'express';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const catchReq = (fn: (req: any, res: Response, next: NextFunction) => void) => (req: Request, res: Response, next:NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};
  
export default catchReq;