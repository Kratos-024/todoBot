import { Router } from "express";
import { getAnswer } from "../controllers/AiChat.controller";

const aiChatRouter = Router();

aiChatRouter.route("/get-answer").post(getAnswer);

export default aiChatRouter;
