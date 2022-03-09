import express from "express";
import CountController from "controller/CountController";
import AuthController from "src/controller/AuthController";
const router = express.Router();

router.get("/", CountController.testController);
router.post("/login", AuthController.login);
router.post("/register", AuthController.register);

export default router;
