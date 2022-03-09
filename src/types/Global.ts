import { Request, Response, NextFunction } from "express";
import { Query } from "express-serve-static-core";

interface TRequest<B, Q extends Query> extends Request {
  body: B;
  query: Q;
}
export type TCBRoute<B = any, Q extends Query = {}> = (
  req: TRequest<B, Q>,
  res: Response,
  next?: NextFunction
) => void;
