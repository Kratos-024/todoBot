import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { LoginInput } from "../types/user.type";
import { AiChat } from "../models/AiChat.models";

export const createAccount = async (
  req: Request,
  username: string,
  password: string,
  email: string,
  whatsappNumber: string
) => {
  try {
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return "Username or email already exists";
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userCreated = await User.create({
      username,
      email,
      password: hashedPassword,
      whatsappNumber,
    });

    if (!userCreated) {
      return "Something went wrong with server";
    }
    req.user = userCreated;
    return "Account created successfully";
  } catch (error) {
    return `Server error ${error}`;
  }
};

export const login = async (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body as LoginInput;

  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    res.status(200).json({ message: "Login successful", userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const get = async (req: Request, res: Response) => {
  try {
    res.status(200).json({ message: "Login successful", userId: "user._id" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
export const trimChatHistory = async (userId: string) => {
  const chatDoc = await AiChat.findOne({ userId });

  if (!chatDoc) {
    console.log("User not found");
    return;
  }

  if (chatDoc.chatHistory.length > 30) {
    chatDoc.chatHistory = chatDoc.chatHistory.slice(5);
    await chatDoc.save();
  }
};
