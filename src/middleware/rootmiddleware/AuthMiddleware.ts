import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
export default (app: express.Application) => {
  app.use(/^((?!\/api\/auth).)*$/, (req, res, next) => {
    const authorization = req.headers.authorization as string;
    try {
      if (!authorization || !/Bearer /g.test(authorization)) throw "err";
      const token = authorization.replace(/Bearer /g, "");
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET as string);
      //@ts-ignore
      const { _id, name, level } = decoded;
      if (!name) throw "err";
      req.body.auth = { _id, name, level };
      next();
    } catch (err) {
      return res.status(401).json({ data: "Forbidden" });
    }
  });
};
