import express from "express";
import dotenv from "dotenv";
import FileUpload from "express-fileupload";
import Cors from "./Cors";
import Routing from "./Routing";
import Database from "./Database";
import RegisterMiddleware from "src/middleware/rootmiddleware/RegisterMiddleware";
import path from "path";

dotenv.config();
export default (app: express.Application) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  const staticPath = path.resolve("src/public");
  app.use(express.static(staticPath));

  // enable files upload
  app.use(
    FileUpload({
      createParentPath: true,
    })
  );

  //cors
  Cors(app);

  //middleware
  RegisterMiddleware(app);

  //routing
  Routing(app);

  //database
  Database();
};
