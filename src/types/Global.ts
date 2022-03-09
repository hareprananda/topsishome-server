import { Request, Response, NextFunction } from "express";
import { Query } from "express-serve-static-core";

type AuthenticatedPayload = {
  auth: {
    _id: string;
    name: string;
    level: string;
  };
};

interface TRequest<B, Q extends Query> extends Request {
  body: B;
  query: Q;
}
export type TCBRoute<B = any, Q extends Query = {}> = (
  req: TRequest<B, Q>,
  res: Response,
  next?: NextFunction
) => void;

export type AuthTCBRoute<B = {}, Q extends Query = {}> = (
  req: TRequest<B & AuthenticatedPayload, Q>,
  res: Response,
  next?: NextFunction
) => void;
