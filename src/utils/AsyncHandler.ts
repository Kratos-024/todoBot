import { NextFunction, Request, Response } from "express";

export const asyncHandler = (
  requestHandler: (...args: any[]) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch(next);
  };
};
