import { Request, Response, NextFunction } from 'express';

const asyncHandler = <T>(
  reqHandler: (req: Request, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(reqHandler(req, res, next)).catch((err) => next(err));
  };
};

export { asyncHandler };