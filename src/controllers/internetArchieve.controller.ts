import axios from "axios";
import fs from "fs";
import { AiChat } from "../models/AiChat.models";
import { Request } from "express";
const api_key = "AIzaSyAvNUI5dmu0EwuntwXEHqmHr1rXb6OJGY0";
const gsi = "613ba84505d114c91";
const getPdf = async (req: Request, bookName: string) => {
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
    bookName + " filetype:pdf"
  )}&key=${api_key}&cx=${gsi}`;

  try {
    const response = await axios.get(url);
    const results = response.data.items;
    let count = 0;
    const searchArray = results.map((item: any) => ({
      imgSrc: item.pagemap.cse_thumbnail,
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      numbered: count++,
    }));
    const jsonString = JSON.stringify(searchArray, null, 2);

    fs.writeFileSync("output.json", jsonString);

    const filterdSearchArray = searchArray.filter(
      (obj: { title: string; snippet: string; link: string }) => {
        return obj.link.toLowerCase().includes(".pdf");
      }
    );
    await AiChat.findOneAndUpdate(
      { userId: req.user?._id },
      {
        pdfBookData: filterdSearchArray,
      }
    );

    let theResponseText = filterdSearchArray
      .map((ele: any) =>
        ele.imgSrc && ele.imgSrc[0] ? ele.imgSrc[0].src : undefined
      )
      .filter((src: any) => src !== undefined);

    return theResponseText;
  } catch (error) {
    //@ts-ignore
    console.error("Search error:", error.response?.data || error.message);
  }
};
const deletePdfData = async (userId: string) => {
  const chatDoc = await AiChat.findOne({ userId });

  if (!chatDoc) {
    console.log("User not found");
    return;
  }

  chatDoc.pdfBookData = [];
  await chatDoc.save();
};
const trimChatHistory = async (userId: string) => {
  const chatDoc = await AiChat.findOne({ userId });

  if (!chatDoc) {
    console.log("User not found");
    return;
  }

  if (chatDoc.chatHistory.length > 20) {
    chatDoc.chatHistory = chatDoc.chatHistory.slice(5); // Remove the first 5 items to keep only the latest 15
    await chatDoc.save();
  }
};

export { getPdf, deletePdfData, trimChatHistory };
