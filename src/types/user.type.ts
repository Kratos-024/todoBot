import { User } from "../models/user.model";
export interface CreateAccountInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginInput {
  usernameOrEmail: string;
  password: string;
}

declare global {
  namespace Express {
    interface Request {
      user: typeof User;
    }
  }
}
