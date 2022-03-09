import express from "express";
import AuthMiddleware from "./AuthMiddleware";

export default (app: express.Application) => {
  AuthMiddleware(app);
};
