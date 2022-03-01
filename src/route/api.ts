import express from "express";
import CountController from "controller/CountController";
const router = express.Router();

router.get("/", CountController.testController);

export default router;
