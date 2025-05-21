import { Router } from "express";
import { SendPingRequest } from "../controllers/cronJob.controller";

const cronJobRouter = Router();

cronJobRouter.route("stayUptime").get(sendPingRequest);
export default cronJobRouter;
