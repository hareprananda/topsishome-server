import express from "express";
import CountController from "controller/CountController";
import AuthController from "src/controller/AuthController";
import CriteriaController from "src/controller/CriteriaController";
import PengajuanController from "src/controller/PengajuanController";
const router = express.Router();

router.post("/auth/login", AuthController.login);
router.post("/auth/register", AuthController.register);
router.get("/me", AuthController.me);

router.get("/criteria", CriteriaController.get);
router.put("/criteria/:id", CriteriaController.update);
router.delete("/criteria/:id", CriteriaController.delete);
router.post("/criteria", CriteriaController.store);

router.get("/pengajuan", PengajuanController.get);
router.get("/pengajuan/:id", PengajuanController.find);
router.post("/pengajuan", PengajuanController.store);
router.delete("/pengajuan/:id", PengajuanController.delete);
router.put("/pengajuan/:id", PengajuanController.update);

router.get("/result", CountController.result);
router.get("/result-detail", CountController.resultDetail);

export default router;
