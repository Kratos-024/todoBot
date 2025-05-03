import { response } from "express";
import mongoose, { model } from "mongoose";
import { number } from "zod";
export interface IAiChat extends Document {
  userId: string;
  chatHistory: Array<{
    user: string;
    aiResponse: string;
    responseByMyCode: string;
  }>;
  pdfBookData: Array<{
    title: string;
    link: string;
    snippet: string;
    numbered: number;
    imgSrc: Array<{
      src: string;
      width: string;
      height: string;
    }>;
  }>;
}
const AiChatSchema = new mongoose.Schema(
  {
    userId: { type: String, require: true },
    chatHistory: [
      {
        user: { type: String, require: true },
        aiResponse: { type: String, require: true },
        responseByMyCode: { type: String, require: true },
      },
    ],
    pdfBookData: [
      {
        title: { type: String },
        snippet: { type: String },
        link: { type: String },
        numbered: { type: Number },
        imgSrc: [
          {
            src: {
              type: String,
            },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const AiChat = mongoose.model<IAiChat>("AiChat", AiChatSchema);
