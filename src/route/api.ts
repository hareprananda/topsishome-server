import express from "express";
import CountController from "controller/CountController";
import AuthController from "src/controller/AuthController";
import CriteriaController from "src/controller/CriteriaController";
import PengajuanController from "src/controller/PengajuanController";
import UserController from "src/controller/UserController";
import AdminMiddleware from "src/middleware/routemiddleware/AdminMiddleware";
import BanjarController from "src/controller/BanjarController";
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
router.post("/upload/users", PengajuanController.uploadFile);

router.get("/banjar", BanjarController.get);
router.put("/banjar/:id", BanjarController.update);
router.delete("/banjar/:id", BanjarController.remove);
router.post("/banjar", BanjarController.store);

router.get("/result", CountController.result);
router.get("/result-profile-chart", PengajuanController.pengajuanChart);
router.get("/result-detail", CountController.resultDetail);
router.get("/result-report", CountController.downloadReport);

router.get("/users", AdminMiddleware(UserController.get));
router.put("/user/:id", AdminMiddleware(UserController.update));

export default router;
