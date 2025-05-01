import { asyncHandler } from "../utils/AsyncHandler";

import { Request, Response } from "express";
import { badRequest, notFound } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
import Todo from "../models/todo.models";

const todoSave = asyncHandler(async (req: Request, res: Response) => {
  const { task, rTime, whatsappNumber } = req.body;

  if (!task || task.trim() === "") {
    throw badRequest("Provide taskName! Undefined task???");
  }

  const todoCreate = await Todo.create({
    rTime,
    task,
    whatsappNumber,
  });

  res.status(200).send(success("Todo Created Successfully", todoCreate));
});
export const todoSave1 = async (todoPram: any, whatsappNumber: string) => {
  console.log(todoPram);
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
  console.log(todoCreate);
  return todoCreate;
};
// const allTodoSend = asyncHandler(async (req: Request, res: Response) => {
//   const { whatsappNumber } = req.body;

//   const todos = await Todo.find({ whatsappNumber });
//   res.status(200).send(success("Todos Found Successfully", todos));
// });

export const allTodoSend = async (whatsappNumber: string) => {
  const todos = await Todo.find({ whatsappNumber: whatsappNumber });
  return todos;
};

export const todoDelete = async (taskId: string, whatsappNumber: string) => {
  if (!taskId || taskId.trim() === "") {
    throw badRequest(
      "Todo Id is not present. Something went wrong with frontend."
    );
  }

  const deletedTodo = await Todo.findByIdAndDelete(taskId);
  if (!deletedTodo) {
    throw notFound("Todo not found");
  }
};
