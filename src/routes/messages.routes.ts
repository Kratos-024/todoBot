import { Router } from "express";
import {
  getMessage,
  sendMessage,
  verifyWebhook,
} from "../controllers/chatBot.controller";

const messageRouter = Router();
messageRouter.route("/send-message").post(sendMessage);

messageRouter.route("/get-message/webhook").post(getMessage);
messageRouter.route("/get-message/webhook").get(verifyWebhook);

export default messageRouter;
