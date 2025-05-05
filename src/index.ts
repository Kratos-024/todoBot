import app from "./app";
import { getTodo } from "./controllers/todo.controller";
import { connectDB } from "./db/db";
const PORT = process.env.PORT;
const cron = require("node-cron");

app.listen(PORT, () => {
  console.log("Server has been started on PORT", PORT);
  cron.schedule("* * * * * *", getTodo);

  connectDB();
});
