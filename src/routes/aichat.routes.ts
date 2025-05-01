import { Router } from "express";
import { getAnswer } from "../controllers/AiChat.controller";
import { userAuth } from "../middlewares/user.auth";

const aiChatRouter = Router();

aiChatRouter.route("/get-answer").post(userAuth, getAnswer);

export default aiChatRouter;
