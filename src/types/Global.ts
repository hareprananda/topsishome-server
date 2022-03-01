import { Request, Response, NextFunction } from "express";

export type TCBRoute<R = void> = (
  req: Request,
  res: Response,
  next?: NextFunction
) => R;
