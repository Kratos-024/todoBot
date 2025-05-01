import { model, Schema } from "mongoose";

const todoSchema = new Schema(
  {
    task: {
      type: String,
      required: true,
    },
    rTime: {
      type: String,
      required: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Todo = model("Todo", todoSchema);
export default Todo;
