import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { success } from "../utils/ApiResponse";
import { badRequest } from "../utils/ApiError";
import fs from "fs";
import path from "path";
import axios from "axios";
import {
  default as makeWASocket,
  DisconnectReason,
  Browsers,
  useMultiFileAuthState,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import qrcode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";

let sock: ReturnType<typeof makeWASocket> | null = null;

const AUTH_DIR = "./auth";
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

const initializeWhatsApp = async () => {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      logger: P({ level: "silent" }),
      browser: Browsers.macOS("Safari"),
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr) {
        console.log("📲 Scan this QR with WhatsApp:");
        qrcodeTerminal.generate(qr, { small: true });

        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const qrFilePath = path.join(
          "src/temp/qr-codes",
          `whatsapp-qr-${timestamp}.png`
        );

        qrcode.toFile(
          qrFilePath,
          qr,
          {
            errorCorrectionLevel: "H",
            type: "png",
            margin: 1,
            width: 800,
          },
          (err) => {
            if (err) {
              console.error("❌ Failed to save QR code to file:", err);
            } else {
              const absolutePath = path.resolve(qrFilePath);
              console.log(`✅ QR Code saved to: ${absolutePath}`);
            }
          }
        );
      }

      if (connection === "close") {
        const shouldReconnect =
          lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output?.statusCode !==
              DisconnectReason.loggedOut
            : true;
        console.log(
          "Connection closed due to",
          lastDisconnect?.error,
          ", reconnecting:",
          shouldReconnect
        );
        if (shouldReconnect) initializeWhatsApp();
      } else if (connection === "open") {
        console.log("✅ Connected to WhatsApp");
      }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const message of messages) {
        if (!message.key.fromMe) {
          try {
            await handleIncomingMessage(message);
          } catch (error) {
            console.error("Error handling incoming message:", error);
          }
        }
      }
    });

    return sock;
  } catch (error) {
    console.error("Failed to initialize WhatsApp:", error);
    return null;
  }
};

const extractMessageContent = (message: proto.IWebMessageInfo) => {
  if (!message.message) return { type: "unknown", content: "" };

  if (message.message.conversation) {
    return { type: "text", content: message.message.conversation };
  } else if (message.message.extendedTextMessage) {
    return {
      type: "text",
      content: message.message.extendedTextMessage.text || "",
    };
  }
  const msgType = Object.keys(message.message)[0];
  return { type: msgType, content: `User sent a ${msgType} message` };
};

const handleIncomingMessage = async (message: proto.IWebMessageInfo) => {
  try {
    const extractedMsg = extractMessageContent(message);
    const whatsappNumber = message.key.remoteJid;

    if (!whatsappNumber) return;

    console.log(`Received ${extractedMsg.type} message from ${whatsappNumber}`);

    try {
      const aiResponse = await axios.post(
        "http://localhost:8000/api/v1/ai-chat/get-answer",
        {
          getQuestion: extractedMsg.content,
          whatsappNumber: whatsappNumber,
          messageType: extractedMsg.type,
        }
      );

      const aiMessage = aiResponse.data;

      await sendMessage(whatsappNumber, aiMessage);
    } catch (error) {
      console.error("Error getting AI response:", error);

      if (sock && whatsappNumber) {
        await sock.sendMessage(whatsappNumber, {
          text: "Sorry, I'm having trouble processing your request right now. Please try again later.",
        });
      }
    }
  } catch (error) {
    console.error("Error in handleIncomingMessage:", error);
  }
};

const isImageUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ];
  const urlLower = url.toLowerCase();

  for (const ext of imageExtensions) {
    if (urlLower.endsWith(ext)) return true;
  }

  if (
    urlLower.includes("images") ||
    urlLower.includes("gstatic.com/images") ||
    urlLower.includes("imgur") ||
    urlLower.includes("cloudinary")
  ) {
    return true;
  }

  return false;
};

const isPdfUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  return url.toLowerCase().endsWith(".pdf");
};

const validateUrl = (url: string): string => {
  if (!url || typeof url !== "string") return "";

  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (e) {
    console.log("error", e);
    return `${e}`;
  }
};

const sendMessage = async (whatsappNumber: string, responseText: any) => {
  if (!sock) {
    console.error("WhatsApp socket not initialized");
    throw new Error("WhatsApp socket not initialized");
  }
  if (!whatsappNumber) {
    throw new Error("WhatsApp number is required");
  }

  let theResponseText: string | any[] = "";
  if (Array.isArray(responseText) && responseText[0]?.task) {
    responseText.forEach((ele) => {
      theResponseText += `\nThe task: ${ele.task}, timing: ${ele.rTime}, id: ${ele._id}\n`;
    });
  } else {
    if (responseText.data) {
      theResponseText = responseText.data;
    } else {
      theResponseText = responseText;
    }
  }

  try {
    let messageId: string | undefined;

    if (
      Array.isArray(theResponseText) &&
      theResponseText.length > 0 &&
      typeof theResponseText[0].srcImg === "string"
    ) {
      await sock.sendMessage(whatsappNumber, {
        text: `Sending you ${Math.min(
          theResponseText.length,
          10
        )} images. Please wait...`,
      });

      const maxImages = Math.min(theResponseText.length, 10);
      for (let i = 0; i < maxImages; i++) {
        if (isImageUrl(theResponseText[i].srcImg)) {
          try {
            const imageResponse = await axios.get(theResponseText[i].srcImg, {
              responseType: "arraybuffer",
            });

            const tempFilePath = path.join(__dirname, `../temp/image_${i}.jpg`);
            fs.writeFileSync(tempFilePath, Buffer.from(imageResponse.data));

            await sock.sendMessage(whatsappNumber, {
              image: { url: tempFilePath },
              caption: `Title *${theResponseText[i].title}*,\n Snippet ${theResponseText[i].snippet},\n numbered ${i} of ${maxImages} if you want this pdf send the numbered ${i}`,
            });

            fs.unlinkSync(tempFilePath);

            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error(`Failed to send image ${i + 1}:`, error);
          }
        }
      }
    } else if (
      typeof theResponseText === "string" &&
      isPdfUrl(theResponseText)
    ) {
      const validatedUrl = validateUrl(theResponseText);

      if (!validatedUrl) {
        throw new Error("Invalid PDF URL");
      }

      await sock.sendMessage(whatsappNumber, {
        text: "Preparing to send your PDF document. Please wait...",
      });

      try {
        const pdfResponse = await axios.get(validatedUrl, {
          responseType: "arraybuffer",
        });

        const tempFilePath = path.join(__dirname, "../temp/document.pdf");
        fs.writeFileSync(tempFilePath, Buffer.from(pdfResponse.data));

        await sock.sendMessage(whatsappNumber, {
          document: { url: tempFilePath },
          mimetype: "application/pdf",
          fileName: "document.pdf",
          caption: "Here your requested PDF document",
        });

        fs.unlinkSync(tempFilePath);

        await sock.sendMessage(whatsappNumber, {
          text: "PDF document has been sent. If you don't see it, please check your WhatsApp settings or try another PDF.",
        });
      } catch (error) {
        console.error("Error sending PDF:", error);
        await sock.sendMessage(whatsappNumber, {
          text: "Sorry, I couldn't send the PDF. The file might be too large or unavailable.",
        });
      }
    } else if (
      typeof theResponseText === "string" &&
      theResponseText.startsWith("http")
    ) {
      const validatedUrl = validateUrl(theResponseText);

      await sock.sendMessage(whatsappNumber, {
        text: `Here's your link: ${validatedUrl}`,
      });
    } else {
      const msgString = String(theResponseText);

      const maxLength = 4096;

      if (msgString.length <= maxLength) {
        await sock.sendMessage(whatsappNumber, {
          text: msgString,
        });
      } else {
        for (let i = 0; i < msgString.length; i += maxLength) {
          const chunk = msgString.substring(i, i + maxLength);
          await sock.sendMessage(whatsappNumber, {
            text: chunk,
          });
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    return messageId || "Message sent";
  } catch (err: any) {
    console.error("WhatsApp API error:", err);
    throw new Error(err.message);
  }
};

const sendMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.body.response) {
      return res.send(badRequest("Response is empty or malformed"));
    }

    const responseText = req.body.response.data || req.body.response;
    const whatsappNumber = req.body.whatsappNumber;

    if (!whatsappNumber) {
      return res.send(badRequest("WhatsApp number is required"));
    }

    if (!sock) {
      await initializeWhatsApp();
    }

    const messageId = await sendMessage(whatsappNumber, responseText);

    res.send(success("Successfully sent the message", messageId));
  } catch (err: any) {
    console.error("Error in sendMessageHandler:", err);
    res.send(badRequest(err.message));
  }
});

initializeWhatsApp()
  .then(() => {
    console.log("WhatsApp client initialized");
  })
  .catch((err) => {
    console.error("Failed to initialize WhatsApp client:", err);
  });

export { sendMessageHandler, initializeWhatsApp };
