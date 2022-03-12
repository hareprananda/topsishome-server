import express from "express";
import CountController from "controller/CountController";
import AuthController from "src/controller/AuthController";
import CriteriaController from "src/controller/CriteriaController";
const router = express.Router();

router.get("/", CountController.testController);
router.post("/auth/login", AuthController.login);
router.post("/auth/register", AuthController.register);
router.get("/me", AuthController.me);

router.get("/criteria", CriteriaController.get);
router.put("/criteria/:id", CriteriaController.update);
router.delete("/criteria/:id", CriteriaController.delete);
router.post("/criteria", CriteriaController.store);

export default router;
