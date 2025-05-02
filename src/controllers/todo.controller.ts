import { badRequest, notFound } from "../utils/ApiError";
import Todo from "../models/todo.models";

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
  return todos;
};
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

export { todoSave, todoDelete, allTodoSend };
