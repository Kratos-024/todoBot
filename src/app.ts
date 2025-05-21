import cors from "cors";
import express from "express";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
import messageRouter from "./routes/messages.routes";
import aiChatRouter from "./routes/aichat.routes";

import cronJobRouter from "./routes/cron.routes";



console.log(process.env.PORT);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/message", messageRouter);
app.use("/api/v1/ai-chat", aiChatRouter);



app.use("/api/v1/cron", cronJobRouter)

export default app;
