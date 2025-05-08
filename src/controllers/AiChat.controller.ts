// import { Request, Response } from "express";
// import { asyncHandler } from "../utils/AsyncHandler";
// import { badRequest } from "../utils/ApiError";
// import { success } from "../utils/ApiResponse";
// import { createAccount } from "./user.controller";
// import stripToMinute, {
//   allTodoSend,
//   todoDelete,
//   todoSave,
// } from "./todo.controller";
// import {
//   getPdf,
//   deletePdfData,
//   trimChatHistory,
// } from "./internetArchieve.controller";
// import { AiChat, IAiChat } from "../models/AiChat.models";
// const aiApi = "AIzaSyBvCHs7Hl_GKc9JhTugUVDT-ulTxNOCwV0";

// export const getAnswer = asyncHandler(async (req: Request, res: Response) => {
//   try {
//     const { getQuestion, whatsappNumber } = req.body;
//     const userId = req.user?._id;
//     console.log("userIduserIduserIduserIduserIduserIduserIduserId", userId);
//     if (!getQuestion || getQuestion.trim() === "") {
//       return res.status(400).json(badRequest("Question cannot be empty", null));
//     }

//     if (!userId) {
//       return res.status(401).json(badRequest("User not authenticated", null));
//     }
//     //@ts-ignore
//     const userChat = await findOrCreateUserChat(userId);

//     const currentTime = stripToMinute(new Date());

//     const aiResponse = await makeAIRequest(getQuestion, userChat, currentTime);
//     if (!aiResponse.success) {
//       return res
//         .status(500)
//         .json(badRequest("AI processing failed", aiResponse.error));
//     }

//     const parsedResponse = aiResponse.data;

//     const processedResponse = await processResponseByType(
//       parsedResponse,
//       whatsappNumber,
//       //@ts-ignore
//       userId,
//       req
//     );
//     //@ts-ignore
//     await updateChatHistory(
//       //@ts-ignore
//       userId,
//       getQuestion,
//       JSON.stringify(parsedResponse),
//       JSON.stringify(processedResponse)
//     );

//     return res
//       .status(200)
//       .json(success("Operation completed successfully", processedResponse));
//   } catch (error: any) {
//     console.error("Error in getAnswer:", error);
//     return res
//       .status(500)
//       .json(
//         badRequest("Server error occurred", error.message || "Unknown error")
//       );
//   }
// });

// async function findOrCreateUserChat(userId: string) {
//   const existingChats = await AiChat.find({ userId });

//   if (existingChats.length === 0) {
//     await AiChat.create({ userId });
//     return { chatHistory: [] };
//   }

//   await trimChatHistory(userId);
//   return existingChats[0];
// }

// async function makeAIRequest(
//   question: string,
//   userChat: any,
//   currentTime: string
// ) {
//   try {
//     //   const prompt = `You are an intelligent assistant that responds with structured JSON based on the user's message. Use the conversation history: ${userChat.chatHistory} and ${userChat.pdfData} to help understand context if needed.

//     // Current date and time is: "${currentTime}" (ISO format, accurate up to the minute)

//     // Respond with only one of the following JSON formats:

//     // ---

//     //  If the user mentions a **task or activity** (e.g. meetings, reminders, chores, events), respond with:

//     // {
//     //   "task": "<detected task>",
//     //   "rTime": "<ISO 8601 datetime string accurate up to the minute (no seconds or milliseconds)>",
//     //   "query": "1"
//     // }

//     // - Extract the task and the **time** from the user's message.
//     // - Use the current time ("${currentTime}") to calculate the actual ISO datetime.
//     // - If the user says "remind me at 9am", compare it to the current time.
//     //   - If 9am has already passed today, schedule it for **tomorrow 9am** instead.
//     // - Format "rTime" like: "2025-05-05T09:00Z" (note: no seconds or milliseconds).

//     // ---

//     // If user wants to **edit a todo** (mentions "edit" and "todoId"):
//     // { "todoId": "<todoId>", "query": "2" }

//     //  If user wants to **view all todos** (phrases like "show my todos", "list todos"):
//     // { "query": "3" }

//     //  If user wants to **delete a todo** (mentions "delete" and "todoId"):
//     // { "todoId": "<todoId>", "query": "4" }

//     //  If user asks for a **PDF of a book** (e.g., "Give me PDF of <book name> by <author>"):
//     // { "query": "6", "bookName": "<book name>", "author": "<author or empty string>", "url": "<search string for finding PDF>" }

//     //  If the input is just a **normal question or message**, respond with a brief answer:
//     // { "query": "5", "response": "<your short answer>" }

//     //  If user replies with a **number** (e.g., "0", "1") and pdfData includes links, respond with:
//     // { "query": "7", "url": "<corresponding pdf link from pdfData>" }

//     //  If user wrote number only tell the user you didnt understand
//     // ---

//     // Important:
//     // - Always return **only one valid JSON object**, no explanations or code formatting.
//     // - All keys and values must be strings (even numbers like "1").
//     // - Be precise, clean, and follow the rules strictly.

//     // User Input: ${question}
//     // `;
//     const prompt = `
//     You are a highly intelligent AI assistant that processes user messages and returns ONLY structured JSON. Your responses must follow the exact specifications below.

//     CONTEXT INFORMATION:
//     - Current time: "${currentTime}" (ISO-8601 format)
//     - User's conversation history: ${JSON.stringify(userChat.chatHistory || [])}
//     - PDF data (if available): ${JSON.stringify(userChat.pdfBookData || {})}

//     RESPONSE FORMATS (Return EXACTLY ONE of these JSON objects):
//     Very very very Important
//     Look on 5 responses  from oldChatHistory to understand what user wants in his new response
//     1️⃣ TASK/REMINDER FORMAT:
//     When user mentions ANY task, appointment, meeting, reminder, or time-based activity:
//     {
//       "query": "1",
//       "task": "<clear description of the detected task/activity>",
//       "rTime": "<ISO-8601 datetime in format YYYY-MM-DDTHH:MM>",
//       "confidence": "<high|medium|low>"
//     }

//     TIME PROCESSING RULES:
//     - If time is explicitly mentioned (e.g., "9am", "14:30", "tomorrow", "next Monday"):
//       * Convert to ISO-8601 format (YYYY-MM-DDTHH:MM)
//       * If time mentioned has already passed today → schedule for tomorrow
//       * Handle relative times ("in 2 hours", "next week Tuesday")
//     - If no time specified → default to 1 hour from current time
//     - Never include seconds or milliseconds in the datetime

//     2️⃣ EDIT TODO FORMAT:
//     When user wants to modify an existing todo (contains words like "edit", "change", "update", "modify" + todoId):
//     {
//       "query": "2",
//       "todoId": "<extracted todoId>",
//       "updateFields": {
//         "task": "<new task description if provided>",
//         "rTime": "<new time if provided in ISO-8601>"
//       }
//     }

//     3️⃣ VIEW TODOS FORMAT:
//     When user wants to see their todos (phrases like "show todos", "list my tasks", "what are my reminders"):
//     {
//       "query": "3",
//       "filter": "<all|today|week|specific date if mentioned>"
//     }

//     4️⃣ DELETE TODO FORMAT:
//     When user wants to remove a todo (contains words like "delete", "remove", "cancel" + todoId):
//     {
//       "query": "4",
//       "todoId": "<extracted todoId>",
//       "confirmation": "<true if user explicitly confirmed deletion>"
//     }

//     5️⃣ STANDARD RESPONSE FORMAT:
//     For general questions/conversations that don't match other categories:
//     {
//       "query": "5",
//       "response": "<concise, helpful answer to user's question>",
//       "sentimentScore": "<-1 to 1 value representing message sentiment>"
//     }

//     6️⃣ PDF REQUEST FORMAT:
//     When user requests a PDF/book (contains phrases like "get me pdf", "find book", "download pdf"):
//     {
//       "query": "6",
//       "bookName": "<extracted book title>",
//       "author": "<author name or empty string>",
//       "url": "<optimized search string for finding PDF>",
//       "year": "<publication year if specified>"
//     }

//     7️⃣ PDF SELECTION FORMAT:
//     When user replies with ONLY a number AND pdfData includes links:
//     {
//       "query": "7",
//       "url": "<corresponding pdf link from pdfData>",
//       "index": "<the numeric index user selected>"
//     }

//     8️⃣ UNRECOGNIZED NUMBER FORMAT:
//     When user sends ONLY a number but no PDF links are available:
//     {
//       "query": "8",
//       "response": "I don't understand what you're referring to with that number. Could you provide more context?"
//     }

//     CRITICAL RULES:
//     1. Return EXACTLY ONE valid JSON object - no explanations, markdown, or text outside the JSON
//     2. ALL keys and values MUST be strings (even numbers like "1")
//     3. JSON must be properly formatted and parseable
//     4. ALWAYS identify the most appropriate query type - prioritize task detection
//     5. If user message contains multiple queries, prioritize in this order: tasks > edit > delete > view > pdf > standard
//     6. For any ambiguous message: default to query type "5" with helpful clarification
//     7. Be extremely precise in extracting dates, times, and IDs
//     8. NEVER include any explanatory text outside of the JSON structure
//     9. Look on oldChatHistory for 5 responses to understand what user wants
//     USER MESSAGE: ${question}
//     `;
//     console.log(userChat.pdfBookData);
//     //     const prompt = ` You are an intelligent assistant that responds with structured JSON based on the user's message. Use the conversation history to help understand context if needed.
//     //      // CONTEXT INFORMATION:
//     //     // - Current time: "${currentTime}" (ISO-8601 format)
//     //     // - User's conversation history: ${userChat.chatHistory}
//     //     // - PDF data (if available): ${userChat.pdfBookData}

//     //   Current date and time is: "${currentTime}" (ISO format, accurate up to the minute)

//     //   Respond with only one of the following JSON formats:

//     //   ---

//     //   1. If the user mentions a **task or activity** (e.g. meetings, reminders, chores, events), respond with:

//     //   {
//     //     "task": "<detected task>",
//     //     "rTime": "<ISO 8601 datetime string accurate up to the minute (no seconds or milliseconds)>",
//     //     "query": "1"
//     //   }

//     //   - Extract the task and the **time** from the user's message.
//     //   - Use the current time ("${currentTime}") to calculate the actual ISO datetime.
//     //   - If the user says "remind me at 9am", compare it to the current time.
//     //     - If 9am has already passed today, schedule it for **tomorrow 9am** instead.
//     //   - Format "rTime" like: "2025-05-05T09:00Z" (note: no seconds or milliseconds).

//     //   ---

//     // 2. If user wants to **edit a todo** (mentions "edit" and "todoId"):
//     // { "todoId": "<todoId>", "query": "2" }

//     // 3. If user wants to **view all todos** (phrases like "show my todos", "list todos"):
//     // { "query": "3" }

//     // 4. If user wants to **delete a todo** (mentions "delete" and "todoId"):
//     // { "todoId": "<todoId>", "query": "4" }

//     // 5. If user asks for a **PDF of a book** (e.g., "Give me PDF of <book name> by <author>"):
//     // { "query": "6", "bookName": "<book name>", "author": "<author or empty string>", "url": "<search string for finding PDF>" }

//     // 6. If the input is just a **normal question or message**, respond with a brief answer:
//     // { "query": "5", "response": "<your short answer>" }

//     // 7. If user replies with a **number** (e.g., "0", "1") and pdfData includes links, respond with:
//     // { "query": "7", "url": "<corresponding pdf link from pdfData>" }

//     // ---

//     // Important:
//     // - Always return **only one valid JSON object**, no explanations or code formatting.
//     // - All keys and values must be strings (even numbers like "1").
//     // - Be precise, clean, and follow the rules strictly.

//     // User Input: ${question}
//     // `;
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApi}`;
//     const response = await fetch(url, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }],
//       }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(
//         `AI API error: ${errorData?.error?.message || response.statusText}`
//       );
//     }

//     const data = await response.json();
//     const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

//     if (!rawText) {
//       throw new Error("Empty response from AI service");
//     }

//     const jsonMatch = rawText.match(/{[\s\S]*}/);
//     if (!jsonMatch) {
//       throw new Error("No valid JSON found in the response");
//     }

//     return { success: true, data: JSON.parse(jsonMatch[0]) };
//   } catch (error: any) {
//     console.error("AI request failed:", error);
//     return { success: false, error: error.message };
//   }
// }

// async function processResponseByType(
//   parsedResponse: any,
//   whatsappNumber: string,
//   userId: string,
//   req: Request
// ) {
//   const queryType = parsedResponse?.query;

//   switch (queryType) {
//     case "1":
//       await todoSave(parsedResponse, whatsappNumber);
//       return "Todo saved successfully";

//     case "2":
//       return "Todo editing functionality not yet implemented";

//     case "3":
//       return await allTodoSend(whatsappNumber);

//     case "4":
//       const todoId = parsedResponse.todoId;
//       const deleteResult = await todoDelete(todoId, whatsappNumber);

//       if (!deleteResult) {
//         return `Todo with ID ${todoId} not found or could not be deleted`;
//       }
//       return `Todo deleted successfully with ID: ${todoId}`;

//     case "5":
//       return parsedResponse.response;

//     case "6":
//       return await getPdf(req, parsedResponse.url);

//     case "7":
//       await deletePdfData(userId);
//       return parsedResponse.url;

//     default:
//       return "I didn't understand that request. Please try again.";
//   }
// }

// async function updateChatHistory(
//   userId: string,
//   userMessage: string,
//   aiResponse: string,
//   processedResponse: string
// ) {
//   const newMessage = {
//     user: userMessage,
//     aiResponse: aiResponse,
//     responseByMyCode: processedResponse,
//     timestamp: new Date(),
//   };

//   await AiChat.findOneAndUpdate(
//     { userId },
//     { $push: { chatHistory: newMessage } },
//     { new: true }
//   );
// }
// export const checkAuthAi = async (
//   req: Request,
//   getQuestion: string,
//   whatsappNumber: string
// ) => {
//   const fullQ = `
//   You are an intelligent assistant. Based on the user input, identify what the user wants and respond in one of the following structured JSON formats:

//   First, check if the input includes **these 3 things** 'username:' and 'password:' and 'email:'.
//   - If yes, respond with:
//     { username: <extracted username>,password: <extracted password>, email": <extracted email>, "query": "1" }

//   - If only one or three of above are mentioned **but it's not in a valid credential format** for login, or if the context seems like an account creation attempt, respond with:
//     { "query": "2", "response": "You are not authorized to enter credentials like this. If you want to create an account, please follow the proper procedure." }

// Important:

// - Return **only** a single JSON object based on the rule.
// - All **keys and values must be strings**, even numbers (e.g., "query": "1").
// - Do **not** include any code formatting like \`\`\`json or explanations.
// - Be concise and accurate.

// User prompt: ${getQuestion}

// `;

//   try {
//     const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApi}`;
//     const aiResponse = await fetch(url, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         contents: [
//           {
//             parts: [
//               {
//                 text: fullQ,
//               },
//             ],
//           },
//         ],
//       }),
//     });
//     const data = await aiResponse.json();
//     const getAnswer = data.candidates[0].content.parts[0].text;
//     const responsedObj = JSON.parse(getAnswer);
//     console.log(responsedObj);
//     let response = "";
//     if (responsedObj["query"] == "1") {
//       response = await createAccount(
//         req,
//         responsedObj["username"],
//         responsedObj["password"],
//         responsedObj["email"],
//         whatsappNumber
//       );
//     } else if (responsedObj["query"] == "2") {
//       response = responsedObj["response"];
//     }
//     await AiChat.create({ userId: req.user?._id });
//     return response;
//   } catch (error: any) {
//     console.log(error);

//     return;
//   }
// };

// export const AiFormatter = async (todo: any): Promise<string> => {
//   const prompt = `Send a friendly reminder: "${todo.task}" at ${new Date(
//     todo.rTime
//   ).toLocaleTimeString()}`;
//   const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiApi}`;
//   const aiResponse = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       contents: [
//         {
//           parts: [
//             {
//               text: prompt,
//             },
//           ],
//         },
//       ],
//     }),
//   });
//   const data = await aiResponse.json();
//   const getAnswer = data.candidates[0].content.parts[0].text;

//   return getAnswer || "Don't forget your task!";
// };
import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { badRequest } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
import { createAccount } from "./user.controller";
import stripToMinute, {
  allTodoSend,
  todoDelete,
  todoSave,
} from "./todo.controller";
import {
  getPdf,
  deletePdfData,
  trimChatHistory,
} from "./internetArchieve.controller";
import { AiChat, IAiChat } from "../models/AiChat.models";
const aiApi = "AIzaSyBvCHs7Hl_GKc9JhTugUVDT-ulTxNOCwV0";

export const getAnswer = asyncHandler(async (req: Request, res: Response) => {
  const { getQuestion, whatsappNumber } = req.body;

  if (getQuestion == "") {
    res.status(400).send(badRequest("Provide Question", getQuestion));
    return;
  }
  const isChatExisted = await AiChat.find({
    userId: req.user?._id,
  });

  let oldHistory;

  if (isChatExisted.length == 0) {
    await AiChat.create({ userId: req.user?._id });
  } else {
    oldHistory = isChatExisted[0].chatHistory;
  }
  const pdfData = isChatExisted[0];
  //@ts-ignore
  trimChatHistory(req.user?._id);
  const now = new Date();

  const currentTime = stripToMinute(new Date(now));

  const fullQ = `
  You are an intelligent assistant that responds with structured JSON based on the user's message. Use the conversation history: ${oldHistory} and ${pdfData} to help understand context if needed.
  
  Current date and time is: "${currentTime}" (ISO format, accurate up to the minute)
  
  Respond with only one of the following JSON formats:
  
  ---
  
  1. If the user mentions a **task or activity** (e.g. meetings, reminders, chores, events), respond with:
  
  {
    "task": "<detected task>",
    "rTime": "<ISO 8601 datetime string accurate up to the minute (no seconds or milliseconds)>",
    "query": "1"
  }
  
  - Extract the task and the **time** from the user's message.
  - Use the current time ("${currentTime}") to calculate the actual ISO datetime.
  - If the user says "remind me at 9am", compare it to the current time.
    - If 9am has already passed today, schedule it for **tomorrow 9am** instead.
  - Format "rTime" like: "2025-05-05T09:00Z" (note: no seconds or milliseconds).
  
  ---

2. If user wants to **edit a todo** (mentions "edit" and "todoId"):
{ "todoId": "<todoId>", "query": "2" }

3. If user wants to **view all todos** (phrases like "show my todos", "list todos"):
{ "query": "3" }

4. If user wants to **delete a todo** (mentions "delete" and "todoId"):
{ "todoId": "<todoId>", "query": "4" }

5. If user asks for a **PDF of a book** (e.g., "Give me PDF of <book name> by <author>"):
{ "query": "6", "bookName": "<book name>", "author": "<author or empty string>", "url": "<search string for finding PDF>" }

6. If the input is just a **normal question or message**, respond with a brief answer:
{ "query": "5", "response": "<your short answer>" }

7. If user replies with a **number** (e.g., "0", "1") and pdfData includes links, respond with:
{ "query": "7", "url": "<corresponding pdf link from pdfData>" }

---

Important:
- Always return **only one valid JSON object**, no explanations or code formatting.
- All keys and values must be strings (even numbers like "1").
- Be precise, clean, and follow the rules strictly.

User Input: ${getQuestion}
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
    console.log("responsedObjresponsedObjresponsedObj", responsedObj);
    let response;
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
      response = "Todo Deleted Successfully";
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
    } else if (responsedObj["query"] == "6") {
      response = await getPdf(req, responsedObj["url"]);
    } else if (responsedObj["query"] == "7") {
      response = responsedObj["url"];
      console.log(
        "yeah this one numbered 0yeah this one numbered 0yeah this one numbered 0",
        response
      );
      //@ts-ignore
      deletePdfData(req.user?._id);
    }

    const newMessage = {
      user: getQuestion,
      aiResponse: JSON.stringify(responsedObj),
      responseByMyCode: JSON.stringify(response),
    };

    await AiChat.findOneAndUpdate(
      { userId: req.user?._id },
      {
        $push: {
          chatHistory: newMessage,
        },
      }
    );

    res.status(200).send(success("Operation done successfully", response));
  } catch (error: any) {
    console.log(error);
    res.status(400).send(badRequest("Something went wrong", error.error));
    return;
  }
});
export const checkAuthAi = async (
  req: Request,
  getQuestion: string,
  whatsappNumber: string
) => {
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
        req,
        responsedObj["username"],
        responsedObj["password"],
        responsedObj["email"],
        whatsappNumber
      );
    } else if (responsedObj["query"] == "2") {
      response = responsedObj["response"];
    }
    await AiChat.create({ userId: req.user?._id });
    return response;
  } catch (error: any) {
    console.log(error);

    return;
  }
};

export const AiFormatter = async (todo: any): Promise<string> => {
  const prompt = `Send a friendly reminder: "${todo.task}" at ${new Date(
    todo.rTime
  ).toLocaleTimeString()}`;
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
              text: prompt,
            },
          ],
        },
      ],
    }),
  });
  const data = await aiResponse.json();
  const getAnswer = data.candidates[0].content.parts[0].text;

  return getAnswer || "Don't forget your task!";
};
