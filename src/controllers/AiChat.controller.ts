import { Request, Response } from "express";

import { asyncHandler } from "../utils/AsyncHandler";
import { badRequest } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
import { allTodoSend, todoDelete, todoSave1 } from "./todo.controller";
const aiApi = "AIzaSyBvCHs7Hl_GKc9JhTugUVDT-ulTxNOCwV0";

const getAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { getQuestion, whatsappNumber } = req.body;
  if (getQuestion == "") {
    res.status(400).send(badRequest("Provide Question", getQuestion));
    return;
  }
  const fullQ = `
  You are an intelligent assistant. Based on the user input, identify what the user wants and respond in one of the following structured JSON formats:
  
  Rules:
  
  1. If the user is mentioning **a task or activity to do** (e.g. meetings, reminders, chores, events, plans), even if it's written casually like "I have a date at 9am", respond with:
     { "task": "<detected task>", "rTime": "<detected time>", "query": "1" }
  
  2. If the user wants to **edit a todo** and mentions "edit" and a "todoId", respond with:
     { "todoId": "<todoId>", "query": "2" }
  
  3. If the user wants to **view all todos** and says phrases like "show me all todos", "get my todos", or "I want to see my todos", respond with:
     { "query": "3" }
  
  4. If the user wants to **delete a todo** and mentions "delete" and a "todoId", respond with:
     { "todoId": "<todoId>", "query": "4" }
  
  5. If the input doesn't match any of the above cases (i.e. it's just a question or random message), then:
     - Understand the user's question.
     - Answer it briefly.
     - Wrap the answer like this:
       { "query": "5", "response": "<your reply to the user>" }

Important:

- Return **only** a single JSON object based on the rule.
- All **keys and values must be strings**, even numbers (e.g., "query": "1").
- Do **not** include any code formatting like \`\`\`json or explanations.
- Be concise and accurate.

User Question: ${getQuestion}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApi}`;
    const aiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: fullQ,
              },
            ],
          },
        ],
      }),
    });
    const data = await aiResponse.json();
    const getAnswer = data.candidates[0].content.parts[0].text;
    console.log("getAnswergetAnswergetAnswergetAnswer", getAnswer);
    console.log(typeof getAnswer);
    const responsedObj = JSON.parse(getAnswer);

    let response = "";
    if (responsedObj["query"] == "1") {
      const taskAddedFunc = todoSave1(responsedObj, whatsappNumber);
    } else if (responsedObj["query"] == "3") {
      console.log(responsedObj["query"]);
      const getAllTodoFuncCall = await allTodoSend(whatsappNumber);
      console.log("getAllTodoFuncCall", getAllTodoFuncCall);
    } else if (responsedObj["query"] == "4") {
      const deleteTodoFuncCall = todoDelete(
        responsedObj["todoId"],
        whatsappNumber
      );
      // if (deleteTodoFuncCall.statusCode == 200) {
      //   response = "Todo deleted SuccessFully";
      // } else {
      //   response = "Something went wrong with the database server";
      // }
    }
    res
      .status(200)
      .send(success("Successfully get the answer", responsedObj["response"]));
  } catch (error: any) {
    console.log(error);
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
