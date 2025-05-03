import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { badRequest } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
import { createAccount } from "./user.controller";
import { allTodoSend, todoDelete, todoSave } from "./todo.controller";
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
  // const fullQ = `
  // You are an intelligent assistant. Based on the user input, identify what the user wants and respond in one of the following structured JSON formats:
  // This is the old History of what user and ai talked ${oldHistory} and ${pdfData}
  // if something asked by user related to user include in oldHistory then use it
  // Rules:

  // 1. If the user is mentioning **a task or activity to do** (e.g. meetings, reminders, chores, events, plans), even if it's written casually like "I have a date at 9am", respond with:
  //    { "task": "<detected task>", "rTime": "<detected time>", "query": "1" }

  // 2. If the user wants to **edit a todo** and mentions "edit" and a "todoId", respond with:
  //    { "todoId": "<todoId>", "query": "2" }

  // 3. If the user wants to **view all todos** and says phrases like "show me all todos", "get my todos", or "I want to see my todos", respond with:
  //    { "query": "3" }

  // 4. If the user wants to **delete a todo** and mentions "delete" and a "todoId", respond with:
  //    { "todoId": "<todoId>", "query": "4" }

  // 5. If the user wants a **PDF of a book** (e.g., "Give me a PDF of this book" or "Can I get the PDF of <bookname> by <author>?"):
  //    - Extract the book name and author from the user's input.
  //    - You may improve the search query by adding extra context (e.g., edition, genre, or publication year) if available or inferred.
  //    - Respond with:
  //      { "query": "6", "bookName": "<cleaned book name>", "author": "<cleaned author name or empty string if unknown>", "url": "<Improved search string like '<book name> by <author> full book pdf'>" }

  // 6. If the input doesn't match any of the above cases (i.e. it's just a question or random message), then:
  //    - Understand the user's question.
  //    - Answer it briefly.
  //    - Wrap the answer like this:
  //      { "query": "5", "response": "<your reply to the user>" }

  // Important:

  // - Return **only** a single JSON object based on the rule.
  // - All **keys and values must be strings**, even numbers (e.g., "query": "1").
  // - Do **not** include any code formatting like \`\`\`json or explanations.
  // - Be concise and accurate.

  // User Question: ${getQuestion}
  // `;
  //@ts-ignore
  trimChatHistory(req.user?._id);
  const fullQ = `
  You are an intelligent assistant. Based on the user input, identify what the user wants and respond in one of the following structured JSON formats:
  This is the old History of what user and ai talked: ${oldHistory} and ${pdfData}
  If something asked by user is included in oldHistory, then use it.
  
  Rules:
  
  1. If the user is mentioning **a task or activity to do** (e.g. meetings, reminders, chores, events, plans), even if it's written casually like "I have a date at 9am", respond with:
     { "task": "<detected task>", "rTime": "<detected time>", "query": "1" }
  
  2. If the user wants to **edit a todo** and mentions "edit" and a "todoId", respond with:
     { "todoId": "<todoId>", "query": "2" }
  
  3. If the user wants to **view all todos** and says phrases like "show me all todos", "get my todos", or "I want to see my todos", respond with:
     { "query": "3" }
  
  4. If the user wants to **delete a todo** and mentions "delete" and a "todoId", respond with:
     { "todoId": "<todoId>", "query": "4" }
  
  5. If the user wants a **PDF of a book** (e.g., "Give me a PDF of this book" or "Can I get the PDF of <bookname> by <author>?"):
     - Extract the book name and author from the user's input.
     - You may improve the search query by adding extra context (e.g., edition, genre, or publication year) if available or inferred.
     - Respond with:
       { "query": "6", "bookName": "<cleaned book name>", "author": "<cleaned author name or empty string if unknown>", "url": "<Improved search string like '<book name> by <author> full book pdf'>" }
  
  6. If the input doesn't match any of the above cases (i.e. it's just a question or random message), then:
     - Understand the user's question.
     - Answer it briefly.
     - Wrap the answer like this:
       { "query": "5", "response": "<your reply to the user>" }
  
  7. If the user replies with a number (like "0", "1", etc., but not a negative number) and **pdfData** includes some links, then:
     - Match the number with the corresponding numbered element of object in pdfData array then add that object link into below json.
     - Respond with:
       { "query": "7", "url": "<link>" }
  
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

export const manageChatData = async (userId: string) => {
  const chatDoc = await AiChat.findOne({ userId });

  if (!chatDoc) return;

  if (chatDoc.chatHistory.length > 20) {
    chatDoc.chatHistory = chatDoc.chatHistory.slice(5);
  }

  await chatDoc.save();

  setTimeout(async () => {
    const updatedDoc = await AiChat.findOne({ userId });
    if (updatedDoc && updatedDoc.pdfBookData.length > 0) {
      updatedDoc.pdfBookData = [];
      await updatedDoc.save();
    }
  }, 5 * 60 * 1000);
};
