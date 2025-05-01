import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { success } from "../utils/ApiResponse";
import axios from "axios";
import { badRequest } from "../utils/ApiError";

const authToken = process.env.AuthToken;
const accountSid = process.env.AccountSid;
const client = require("twilio")(accountSid, authToken);

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.response || !req.body.response.data) {
    return res.send(badRequest("Response is empty or malformed"));
  }

  const responseText = req.body.response.data;

  try {
    const messageFunc = await client.messages.create({
      from: "whatsapp:+14155238886",
      contentSid: "HX2cc589a48c4a7edfedbb7289b11864e0",
      contentVariables: JSON.stringify({
        "2": responseText,
      }),
      to: `whatsapp:+${req.body.whatsappNumber}`,
    });

    console.log("Full Twilio response:", messageFunc);
    const message = messageFunc.sid;
    res.send(success("Successfully sent the message", message));
  } catch (err) {
    console.error("Twilio error:", err);
    //@ts-ignore
    res.send(badRequest(err.message));
  }
});

const getMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body;

  try {
    if (!data.Body) {
      return;
    }
    const aiResponse = await axios.post(
      "http://localhost:8000/api/v1/ai-chat/get-answer",
      {
        getQuestion: data.Body,
        whatsappNumber: data.WaId,
      }
    );
    const aiMessage = aiResponse.data;
    await axios.post("http://localhost:8000/api/v1/message/send-message", {
      response: aiMessage,
      whatsappNumber: data.WaId,
    });
    res.send(
      success("Successfully sent the message", "Message sent to AI chat")
    );
  } catch (error) {
    //@ts-ignore
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

const parseTheMessage = async (message: { task: string; rTime: string }) => {
  try {
    if (!message["task"] || message.task == "") {
      return;
    }
    const task = message["task"];
    const remindingTiming = message["rTime"];
    const response = await axios.post("");
  } catch (error) {}
};

export { sendMessage, getMessage };
