import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { success } from "../utils/ApiResponse";
import axios from "axios";

const authToken = process.env.AuthToken;
const accountSid = process.env.AccountSid;
const client = require("twilio")(accountSid, authToken);

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const messageFunc = await client.messages.create({
    from: "whatsapp:+14155238886",
    contentSid: "HXb5b62575e6e4ff6129ad7c8efe1f983e",
    contentVariables: '{"1":"hello"}',
    to: "whatsapp:+918512094758",
  });

  const message = messageFunc.sid;
  console.log("Message SID:", message);
  res.send(success("Successfully sent the message", message));
});

const getMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;
  console.log("Received message:", data.Body);

  try {
    if (!data.Body) {
      return;
    }
    const aiResponse = await axios.post(
      "http://localhost:8000/api/v1/ai-chat/get-answer",
      {
        getQuestion: data.Body,
      }
    );
    const aiMessage = aiResponse.data.data;

    await axios.post("http://localhost:8000/api/v1/ai-chat/send-message", {
      message: aiMessage,
    });

    res.send(
      success("Successfully sent the message", "Message sent to AI chat")
    );
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

export { sendMessage, getMessage };
