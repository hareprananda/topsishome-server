import express from "express";
import { API_PREFIX } from "src/const/Route";

export default (app: express.Application) => {
  app.use(API_PREFIX, (req, res, next) => next());
};
