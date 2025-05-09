import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { success } from "../utils/ApiResponse";
import axios from "axios";
import { badRequest } from "../utils/ApiError";

const token = process.env.WHATSAPP_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const apiVersion = "v22.0";
const baseUrl = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

const sendMultipleImages = async (
  imageUrls: {
    srcImg: string;
    title: string;
    snippet: string;
  }[],
  whatsappNumber: string
): Promise<string[]> => {
  const messageIds: string[] = [];
  const maxImages = Math.min(imageUrls.length, 10);

  try {
    await axios.post(
      baseUrl,
      {
        messaging_product: "whatsapp",
        to: whatsappNumber,
        type: "text",
        text: {
          body: `Sending you ${maxImages} images. Please wait...`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    for (let i = 0; i < maxImages; i++) {
      try {
        if (isImageUrl(imageUrls[i].srcImg)) {
          const response = await axios.post(
            baseUrl,
            {
              messaging_product: "whatsapp",
              to: whatsappNumber,
              type: "image",
              image: {
                link: imageUrls[i].srcImg,
                caption: `Title *${imageUrls[i].title}*,\n Snippet ${imageUrls[i].snippet},\n numbered ${i} of ${maxImages} if you want this pdf send the numbered ${i}`,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data.messages && response.data.messages[0].id) {
            messageIds.push(response.data.messages[0].id);
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(
          `Failed to send image ${i + 1}:`,
          error.response?.data || error.message
        );
      }
    }
  } catch (error: any) {
    console.error(
      "Error sending initial message:",
      error.response?.data || error.message
    );
  }

  return messageIds;
};

const isImageUrl = (imgUrl: string): boolean => {
  if (!imgUrl || typeof imgUrl !== "string") {
    return false;
  }

  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".svg",
  ];

  const url = imgUrl.toLowerCase();
  for (const ext of imageExtensions) {
    if (url.endsWith(ext)) {
      return true;
    }
  }

  if (
    url.includes("images") ||
    url.includes("gstatic.com/images") ||
    url.includes("imgur") ||
    url.includes("cloudinary")
  ) {
    return true;
  }

  return false;
};

const isPdfUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") {
    return false;
  }
  return url.toLowerCase().includes(".pdf");
};

// Function to validate and fix URLs
const validateUrl = (url: string): string => {
  if (!url || typeof url !== "string") {
    return "";
  }

  // Check if URL is properly formatted
  try {
    const urlObj = new URL(url);
    return urlObj.toString();
  } catch (e) {
    // If not a valid URL, check if it's a relative path
    if (url.startsWith("/")) {
      // Convert to absolute URL (replace with your domain)
      return `https://yourdomain.com${url}`;
    }
    // If not relative, try adding https://
    if (!url.startsWith("http")) {
      return `https://${url}`;
    }
  }
  return url;
};

const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.response) {
    return res.send(badRequest("Response is empty or malformed"));
  }

  let responseText = req.body.response.data || req.body.response;
  const whatsappNumber = req.body.whatsappNumber;

  console.log("Raw response:", JSON.stringify(responseText));

  if (!whatsappNumber) {
    return res.send(badRequest("WhatsApp number is required"));
  }

  let theResponseText: string | any[] = "";

  if (Array.isArray(responseText) && responseText[0]?.task) {
    responseText.forEach((ele) => {
      theResponseText += `\nThe task: ${ele.task}, timing: ${ele.rTime}, id: ${ele._id}\n`;
    });
  } else {
    theResponseText = responseText;
  }

  try {
    let messageResponse;
    let messageId;

    // Handle case when it's an array of image objects
    if (
      Array.isArray(theResponseText) &&
      theResponseText.length > 0 &&
      typeof theResponseText[0].srcImg === "string"
    ) {
      const messageIds = await sendMultipleImages(
        theResponseText,
        whatsappNumber
      );
      messageId = messageIds.join(", ");
    }
    // Handle PDF URL specifically
    else if (typeof theResponseText === "string" && isPdfUrl(theResponseText)) {
      console.log("Sending PDF document:", theResponseText);

      const validatedUrl = validateUrl(theResponseText);
      console.log("Validated URL:", validatedUrl);

      if (!validatedUrl) {
        return res.send(badRequest("Invalid PDF URL"));
      }

      // First send a message indicating a PDF is coming
      await axios.post(
        baseUrl,
        {
          messaging_product: "whatsapp",
          to: whatsappNumber,
          type: "text",
          text: {
            body: "Preparing to send your PDF document. Please wait...",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Then send the actual PDF
      messageResponse = await axios.post(
        baseUrl,
        {
          messaging_product: "whatsapp",
          to: whatsappNumber,
          type: "document",
          document: {
            link: validatedUrl,
            caption: "Here's your requested PDF document",
            filename: "document.pdf", // Add explicit filename
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("PDF send response:", JSON.stringify(messageResponse.data));
      messageId = messageResponse.data.messages?.[0]?.id;

      // Send a follow-up message to confirm delivery was attempted
      await axios.post(
        baseUrl,
        {
          messaging_product: "whatsapp",
          to: whatsappNumber,
          type: "text",
          text: {
            body: "PDF document has been sent. If you don't see it, please check your WhatsApp settings or try another PDF.",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
    }
    // Handle regular URL
    else if (
      typeof theResponseText === "string" &&
      theResponseText.startsWith("http")
    ) {
      const validatedUrl = validateUrl(theResponseText);
      console.log("Sending URL as document:", validatedUrl);

      messageResponse = await axios.post(
        baseUrl,
        {
          messaging_product: "whatsapp",
          to: whatsappNumber,
          type: "text",
          text: {
            preview_url: true,
            body: `Here's your link: ${validatedUrl}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      messageId = messageResponse.data.messages?.[0]?.id;
    }
    // Handle regular text message
    else {
      console.log("Sending text message");
      messageResponse = await axios.post(
        baseUrl,
        {
          messaging_product: "whatsapp",
          to: whatsappNumber,
          type: "text",
          text: {
            body: String(theResponseText).substring(0, 4096), // WhatsApp has a 4096 character limit
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      messageId = messageResponse.data.messages?.[0]?.id;
    }

    res.send(
      success("Successfully sent the message", messageId || "Message sent")
    );
  } catch (err: any) {
    console.error("WhatsApp API error:", err.response?.data || err.message);
    res.send(badRequest(err.response?.data?.error?.message || err.message));
  }
});

const getMessage = asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = req.body;

    const messages = data.entry?.[0]?.changes?.[0]?.value?.messages;

    if (!messages || messages.length === 0) {
      console.log("No messages in webhook payload");
      return res.sendStatus(200);
    }

    const message = messages[0];

    let messageContent = "";
    const messageType = message.type;

    if (messageType === "text") {
      messageContent = message.text?.body;
    } else if (messageType === "image") {
      messageContent = "User sent an image";
    } else if (messageType === "document") {
      messageContent = "User sent a document";
    } else if (messageType === "location") {
      messageContent = `User shared location: ${message.location?.latitude}, ${message.location?.longitude}`;
    } else if (messageType === "contacts") {
      messageContent = "User shared contact(s)";
    } else {
      messageContent = `User sent a ${messageType} message`;
    }

    const whatsappNumber = message.from;

    if (!messageContent) {
      console.log("No message content to process");
      return res.sendStatus(200);
    }

    const aiResponse = await axios.post(
      "http://localhost:8000/api/v1/ai-chat/get-answer",
      {
        getQuestion: messageContent,
        whatsappNumber: whatsappNumber,
        messageType: messageType,
      }
    );

    const aiMessage = aiResponse.data;

    await axios.post("http://localhost:8000/api/v1/message/send-message", {
      response: aiMessage,
      whatsappNumber: whatsappNumber,
    });

    res.send(
      success("Successfully processed message", "Message sent to AI chat")
    );
  } catch (error: any) {
    console.error("Error in getMessage:", error.message);
    res.status(500).send({ success: false, message: "Internal Server Error" });
  }
});

const verifyWebhook = (req: Request, res: Response) => {
  const WEBHOOK_TOKEN = process.env.WEBHOOK_TOKEN || "my-verify-save";
  const mode = req.query["hub.mode"];
  const challenge = req.query["hub.challenge"];
  const token = req.query["hub.verify_token"];

  if (mode && token === WEBHOOK_TOKEN) {
    res.status(200).send(challenge);
  } else {
    console.log("Webhook verification failed");
    res.sendStatus(400);
  }
};

export { sendMessage, getMessage, verifyWebhook };
