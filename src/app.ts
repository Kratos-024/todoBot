import cors from "cors";
import express from "express";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
import messageRouter from "./routes/messages.routes";
import aiChatRouter from "./routes/aichat.routes";
<<<<<<< HEAD
import cronJobRouter from "./routes/cron.routes";
=======
import cronJobRouter from "./routes/cron.routes"

>>>>>>> fac9867b9a9ae0041a1b843a191a760d61c6dcb7

console.log(process.env.PORT);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/message", messageRouter);
app.use("/api/v1/ai-chat", aiChatRouter);
<<<<<<< HEAD
app.use("/api/v1/cron", cronJobRouter);
=======
app.use("/api/v1/cron", cronJobRouter)
>>>>>>> fac9867b9a9ae0041a1b843a191a760d61c6dcb7

export default app;
