import { Request, Response } from "express";

import { asyncHandler } from "../utils/AsyncHandler";
import { badRequest } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
const aiApi = "AIzaSyBvCHs7Hl_GKc9JhTugUVDT-ulTxNOCwV0";
const getAnswer = asyncHandler(async (req: Request, res: Response) => {
  const getQuestion = req.body.getQuestion as string;
  console.log(getQuestion);
  if (getQuestion == "") {
    res.status(400).send(badRequest("Provide Question", getQuestion));
    return;
  }
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApi}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: getQuestion,
              },
            ],
          },
        ],
      }),
    });
    const data = await response.json();

    const getAnswer = data.candidates[0].content.parts[0].text;
    res.status(200).send(success("Successfully get the answer", getAnswer));
  } catch (error: any) {
    res.status(400).send(badRequest("Something went wrong", error.error));
    return;
  }
});
// const getAllChats = asyncHandler(async (req: Request, res: Response) => {
//   try {
//     const chat = await Chat.find({
//       userId: req.user._id,
//     });

//     if (!chat) {
//       res.status(400).send(new ApiError(400, "Chats not found", chat));
//       return;
//     }

//     res
//       .status(200)
//       .send(new ApiResponse(200, chat, "Successfully get the Chats"));
//   } catch (error: any) {
//     res
//       .status(400)
//       .send(new ApiError(400, "Something went wrong", error.error));
//     return;
//   }
// });
// const getParticularChat = asyncHandler(async (req: Request, res: Response) => {
//   const chatId = req.query.id;
//   if (chatId == "") {
//     res.status(404).send(new ApiError(400, "Chat with this id is not avaible"));
//     return;
//   }
//   try {
//     const chat = await Chat.findOne({
//       userId: req.user._id,
//       "sessions.sessionId": chatId,
//     });

//     if (!chat) {
//       res.status(404).send(new ApiError(400, "Chat not found"));
//       return;
//     }

//     res
//       .status(200)
//       .send(new ApiResponse(200, chat, "Successfully get the Chats"));
//   } catch (error: any) {
//     res
//       .status(400)
//       .send(new ApiError(400, "Something went wrong", error.error));
//     return;
//   }
// });
// const saveChatAtCurrentSession = asyncHandler(
//   async (req: Request, res: Response) => {
//     const { chat } = req.body;
//     const sessionId = req.query.id;
//     const userId = req.user._id;
//     if (chat == "") {
//       res
//         .status(400)
//         .send(
//           new ApiError(400, "Chat body please provide! Something  went wrong")
//         );
//       return;
//     }
//     const { response_frm, response, chatId } = chat.messages;

//     try {
//       const updateChatSection = await Chat.findOneAndUpdate(
//         {
//           "sessions.sessionId": sessionId,
//           userId,
//         },
//         {
//           $push: {
//             "sessions.$.messages": {
//               response_frm,
//               response,
//               chatId,
//             },
//           },
//         },
//         { new: true }
//       );

//       res
//         .status(200)
//         .send(
//           new ApiResponse(200, updateChatSection, "Successfully saved the Chat")
//         );
//       return;
//     } catch (error: any) {
//       res
//         .status(400)
//         .send(new ApiError(400, "Something went wrong", error.error));
//       return;
//     }
//   }
// );
// const saveNewChatSession = asyncHandler(async (req: Request, res: Response) => {
//   const { chat } = req.body;
//   const sessionId = req.query.id;
//   const userId = req.user._id;
//   if (chat == "") {
//     res
//       .status(400)
//       .send(
//         new ApiError(400, "Chat body please provide! Something  went wrong")
//       );
//     return;
//   }
//   const { response_frm, response, chatId, chatName } = chat.messages;

//   try {
//     const createNewChatSession = await Chat.create({
//       userId,
//       sessions: [
//         {
//           sessionId,
//           chatName: response,
//           messages: [
//             {
//               response_frm,
//               response,
//               chatId,
//             },
//           ],
//         },
//       ],
//     });
//     res
//       .status(200)
//       .send(
//         new ApiResponse(
//           200,
//           createNewChatSession,
//           "Successfully saved the Chat"
//         )
//       );
//     return;
//   } catch (error: any) {
//     res
//       .status(400)
//       .send(new ApiError(400, "Something went wrong", error.error));
//     return;
//   }
// });

export {
  getAnswer,
  //   getAllChats,
  //   getParticularChat,
  //   saveNewChatSession,
  //   saveChatAtCurrentSession,
};
