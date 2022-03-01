import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

export default (app: express.Application) => {
  app.use(
    cors({
      origin: process.env.CLIENT_ENDPOINT,
      methods: "*",
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
};
