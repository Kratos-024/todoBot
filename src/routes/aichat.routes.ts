import { Router } from "express";
import { handleAuthOrCreate, userAuth } from "../middlewares/user.auth";
import { getAnswer } from "../controllers/AiChat.controller";

const aiChatRouter = Router();

aiChatRouter.route("/get-answer").post(handleAuthOrCreate, getAnswer);

export default aiChatRouter;
