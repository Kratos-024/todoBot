import cors from "cors";
import express from "express";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });
import userRouter from "./routes/user.route";
import messageRouter from "./routes/messages.routes";
import aiChatRouter from "./routes/aichat.routes";

console.log(process.env.PORT);
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/user", userRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/ai-chat", aiChatRouter);

export default app;
