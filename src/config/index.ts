import express from "express";
import dotenv from "dotenv";
import Cors from "./Cors";
import Routing from "./Routing";
import Middleware from "./Middleware";
import Database from "./Database";

dotenv.config();
export default (app: express.Application) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  //cors
  Cors(app);

  //middleware
  Middleware(app);

  //routing
  Routing(app);

  //database
  Database();
};
