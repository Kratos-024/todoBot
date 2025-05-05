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
  let responseText = req.body.response.data;

  console.log("Here comes", responseText);
  console.log("Here comes2", req.body.response);
  let theResponseText: string | any[] = "";
  if (Array.isArray(responseText) && responseText[0].task) {
    responseText.map((ele) => {
      theResponseText += `\nThe task: ${ele.task}, timing: ${ele.rTime}, id: ${ele._id}\n`;
    });
  } else {
    theResponseText = responseText;
  }

  try {
    let messageFunc;
    if (
      theResponseText &&
      theResponseText.length &&
      theResponseText[0].startsWith("http")
    ) {
      messageFunc = await client.messages.create({
        from: "whatsapp:+14155238886",
        to: `whatsapp:+${req.body.whatsappNumber}`,
        body: "Here are the book results:",
        mediaUrl: theResponseText,
      });
    } else if (theResponseText && theResponseText.includes(".pdf")) {
      console.log(responseText);

      messageFunc = await client.messages.create({
        from: "whatsapp:+14155238886",
        to: `whatsapp:+${req.body.whatsappNumber}`,
        body: "Here are the book results:",
        mediaUrl: [theResponseText],
      });
    } else {
      console.log("Entereted ", "below");

      messageFunc = await client.messages.create({
        from: "whatsapp:+14155238886",
        contentSid: "HX2cc589a48c4a7edfedbb7289b11864e0",
        contentVariables: JSON.stringify({
          "2": `${theResponseText}`,
        }),
        to: `whatsapp:+${req.body.whatsappNumber}`,
      });
    }

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
