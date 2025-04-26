import app from "./app";
import { connectDB } from "./db/db";
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log("Server has been started on PORT", PORT);
  connectDB();
});
