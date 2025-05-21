import { Router } from "express";
import { stayUp } from "../controllers/cron.controller";

const cronJobRouter = Router();

cronJobRouter.route("/stayUptime").post(stayUp);
export default cronJobRouter;
