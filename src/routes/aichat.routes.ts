import { Router } from "express";
import { getAnswer } from "../controllers/AiChat.controller";
import { handleAuthOrCreate, userAuth } from "../middlewares/user.auth";

const aiChatRouter = Router();

aiChatRouter.route("/get-answer").post(handleAuthOrCreate, getAnswer);

export default aiChatRouter;
