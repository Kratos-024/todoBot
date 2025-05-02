import { Router } from "express";
import { createAccount, get, login } from "../controllers/user.controller";

const userRouter = Router();

// userRouter.route("/create-account").post(createAccount);
// userRouter.route("/login-account").post(login);
// userRouter.route("/get-message").get(get);

export default userRouter;
