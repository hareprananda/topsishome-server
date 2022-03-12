import { Request, Response, NextFunction } from "express";

type AuthenticatedPayload = {
  auth: {
    _id: string;
    name: string;
    level: string;
  };
};

interface TRequest<B, Q extends Request["query"], P extends Request["params"]>
  extends Request {
  body: B;
  query: Q;
  params: P;
}
export type TCBRoute<
  B = any,
  Q extends Request["query"] = {},
  P extends Request["params"] = {}
> = (req: TRequest<B, Q, P>, res: Response, next?: NextFunction) => void;

export type AuthTCBRoute<
  B = {},
  Q extends Request["query"] = {},
  P extends Request["params"] = {}
> = (
  req: TRequest<B & AuthenticatedPayload, Q, P>,
  res: Response,
  next?: NextFunction
) => void;
