import { Router } from "express";
import { sendPingRequest } from "../controllers/cronJob.controller";

const cronJobRouter = Router();

cronJobRouter.route("stayUptime").get(sendPingRequest);
export default cronJobRouter;
