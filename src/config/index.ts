import express from "express";
import dotenv from "dotenv";
import Cors from "./Cors";
import Routing from "./Routing";
import Database from "./Database";
import RegisterMiddleware from "src/middleware/rootmiddleware/RegisterMiddleware";

dotenv.config();
export default (app: express.Application) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  //cors
  Cors(app);

  //middleware
  RegisterMiddleware(app);

  //routing
  Routing(app);

  //database
  Database();
};
