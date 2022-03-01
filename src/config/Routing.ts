import express from "express";
import api from "route/api";
import { API_PREFIX } from "src/const/Route";

export default (app: express.Application) => {
  app.use(API_PREFIX, api);
  app.get("*", (req, res) => res.status(404).send("Not Found"));
};
