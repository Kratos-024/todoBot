import { badRequest, notFound } from "../utils/ApiError";
import Todo from "../models/todo.models";
import axios from "axios";
import { AiFormatter } from "./AiChat.controller";

const todoDelete = async (
  taskId: string,
  whatsappNumber: string
): Promise<boolean> => {
  if (!taskId || taskId.trim() === "") {
    throw badRequest(
      "Todo ID is missing. Something went wrong with the frontend."
    );
  }

  const deletedTodo = await Todo.findByIdAndDelete(taskId);

  if (!deletedTodo) {
    notFound("Todo not found", false);
  }

  return true;
};

export default function stripToMinute(date: Date): string {
  const newDate = new Date(date);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate.toISOString().slice(0, 16) + "Z";
}

export const getTodo = async () => {
  try {
    const todos = await Todo.find({});

    if (!todos || todos.length === 0) return;

    const now = new Date();

    const currentRounded = stripToMinute(new Date(now));

    for (const todo of todos) {
      const rTime = todo.rTime;
      const taskRounded = stripToMinute(new Date(rTime));

      if (currentRounded === taskRounded) {
        const message = await AiFormatter(todo);
        todoDelete(
          todo._id.toString().split(`ObjectId`)[0],
          todo.whatsappNumber
        );
        await axios.post("http://localhost:8000/api/v1/message/send-message", {
          response: message,
          whatsappNumber: todo.whatsappNumber,
        });
      }
    }
  } catch (error) {
    console.error("Error in getTodo cron:", error);
  }
};

const todoSave = async (todoPram: any, whatsappNumber: string) => {
  const { task, rTime } = todoPram;
  console.log(task, rTime, whatsappNumber);
  if (!task || task.trim() === "") {
    throw badRequest("Provide taskName! Undefined task???");
  }

  const todoCreate = await Todo.create({
    rTime,
    task,
    whatsappNumber,
  });
  return todoCreate;
};

const allTodoSend = async (whatsappNumber: string) => {
  const todos = await Todo.find({ whatsappNumber: whatsappNumber });
  if (!todos || todos.length > 0) {
    return todos;
  } else {
    return "No Todos found";
  }
};

export { todoSave, todoDelete, allTodoSend };
