import { Request, response, Response } from "express";

import { asyncHandler } from "../utils/AsyncHandler";
import { badRequest } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
import { createAccount } from "./user.controller";
import { allTodoSend, todoDelete, todoSave } from "./todo.controller";
const aiApi = "AIzaSyBvCHs7Hl_GKc9JhTugUVDT-ulTxNOCwV0";

const getAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { getQuestion, whatsappNumber } = req.body;
  console.log("getQuestiongetQuestiongetQuestiongetQuestion", getQuestion);

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
    const jsonMatch = getAnswer.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error("No valid JSON found in the response");
    }

    const responsedObj = JSON.parse(jsonMatch[0]);
    console.log(responsedObj);
    let response;
    console.log("Sfkdsklfkfslfsdlkfdslkfdklsf", responsedObj);
    if (responsedObj["query"] == "1") {
      todoSave(responsedObj, whatsappNumber);
      response = "Todo saved successfully";
    } else if (responsedObj["query"] == "3") {
      response = await allTodoSend(whatsappNumber);
    } else if (responsedObj["query"] == "4") {
      const deletedTodoReponse = await todoDelete(
        responsedObj["todoId"],
        whatsappNumber
      );
      //@ts-ignore
      if (!deletedTodoReponse?.data) {
        response =
          "Something went wrong with this todo  id maybe it is not in database " +
          responsedObj["todoId"];
        res.status(200).send(success("Operation done successfully", response));
        return;
      }
      response =
        "Todo Deleted successfully with todoid: " + responsedObj["todoId"];
    } else if (responsedObj["query"] == "5") {
      response = responsedObj["response"];
    }
    console.log(response);
    res.status(200).send(success("Operation done successfully", response));
  } catch (error: any) {
    console.log(error);
    res.status(400).send(badRequest("Something went wrong", error.error));
    return;
  }
});
export const checkAuthAi = async (
  getQuestion: string,
  whatsappNumber: string
) => {
  console.log("getghhhhhhhhhhhhhh", getQuestion);
  const fullQ = `
  You are an intelligent assistant. Based on the user input, identify what the user wants and respond in one of the following structured JSON formats:

  First, check if the input includes **these 3 things** 'username:' and 'password:' and 'email:'.
  - If yes, respond with:
    { username: <extracted username>,password: <extracted password>, email": <extracted email>, "query": "1" }

  - If only one or three of above are mentioned **but it's not in a valid credential format** for login, or if the context seems like an account creation attempt, respond with:
    { "query": "2", "response": "You are not authorized to enter credentials like this. If you want to create an account, please follow the proper procedure." }

Important:

- Return **only** a single JSON object based on the rule.
- All **keys and values must be strings**, even numbers (e.g., "query": "1").
- Do **not** include any code formatting like \`\`\`json or explanations.
- Be concise and accurate.

User prompt: ${getQuestion}

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
    const responsedObj = JSON.parse(getAnswer);
    console.log(responsedObj);
    let response = "";
    if (responsedObj["query"] == "1") {
      response = await createAccount(
        responsedObj["username"],
        responsedObj["password"],
        responsedObj["email"],
        whatsappNumber
      );
    } else if (responsedObj["query"] == "2") {
      response = responsedObj["response"];
    }
    return response;
  } catch (error: any) {
    console.log(error);

    return;
  }
};

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
