import express from "express";
import { sendMessageHandler } from "../controllers/baileys.controller";

const messageRouter = express.Router();

messageRouter.post("/send-message", sendMessageHandler);

export default messageRouter;
