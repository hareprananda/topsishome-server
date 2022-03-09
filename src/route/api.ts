import express from "express";
import CountController from "controller/CountController";
import AuthController from "src/controller/AuthController";
const router = express.Router();

router.get("/", CountController.testController);
router.post("/auth/login", AuthController.login);
router.post("/auth/register", AuthController.register);
router.get("/me", AuthController.me);

export default router;
