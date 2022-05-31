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
router.put("/criteria/:id", AdminMiddleware(CriteriaController.update));
router.delete("/criteria/:id", AdminMiddleware(CriteriaController.delete));
router.post("/criteria", AdminMiddleware(CriteriaController.store));

router.get("/pengajuan", PengajuanController.get);
router.get("/pengajuan/:id", PengajuanController.find);
router.post("/pengajuan", AdminMiddleware(PengajuanController.store));
router.delete("/pengajuan/:id", AdminMiddleware(PengajuanController.delete));
router.put("/pengajuan/:id", AdminMiddleware(PengajuanController.update));
router.post("/upload/users", AdminMiddleware(PengajuanController.uploadFile));

router.get("/banjar", BanjarController.get);
router.put("/banjar/:id", AdminMiddleware(BanjarController.update));
router.delete("/banjar/:id", AdminMiddleware(BanjarController.remove));
router.post("/banjar", AdminMiddleware(BanjarController.store));

router.get("/result", CountController.result);
router.get("/result-profile-chart", PengajuanController.pengajuanChart);
router.get("/result-detail", CountController.resultDetail);
router.get("/result-report", CountController.downloadReport);
router.get("/result-pdf", CountController.downloadPDF);

router.get("/users", AdminMiddleware(UserController.get));
router.put("/user/:id", AdminMiddleware(UserController.update));

export default router;
