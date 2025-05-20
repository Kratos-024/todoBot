import express from "express";
import multer from "multer";
import { uploadQR } from "../controllers/baileys.controller";

const qrRouter = express.Router();
const upload = multer({ dest: "uploads/" });

qrRouter.post("/send-qr", upload.single("file"), uploadQR);

export default qrRouter;
