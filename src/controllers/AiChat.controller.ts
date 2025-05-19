import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { badRequest } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
import { createAccount, trimChatHistory } from "./user.controller";
import stripToMinute, {
  allTodoSend,
  todoDelete,
  todoSave,
} from "./todo.controller";
import { getPdf, deletePdfData } from "./GoogleSearch.controller";
import { AiChat, IAiChat } from "../models/AiChat.models";
const aiApi = process.env.Gemini_Api_key;

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
  You are an intelligent assistant that responds with structured JSON based on the user's message.
  Use the conversation history: ${oldHistory} and ${pdfData} to help understand context if needed !!!ERY VERY IMPORTANT.

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
    console.log(aiApi);
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
        response = responsedObj["todoId"];
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
    { "query": "2", "response": "You are not authorized to enter credentials like this. If you want to create an account, please follow the proper procedure,
     username: <username>"
     email:<email(can enter fake email also cuz no otp problem for now)>
     password:<password> }

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
