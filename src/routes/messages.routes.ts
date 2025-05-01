import { Router } from "express";
import { getMessage, sendMessage } from "../controllers/chatBot.controller";
import { userAuth } from "../middlewares/user.auth";

const messageRouter = Router();
messageRouter.route("/send-message").post(sendMessage);

messageRouter.route("/get-message").post(getMessage);

export default messageRouter;
