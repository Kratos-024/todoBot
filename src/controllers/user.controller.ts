import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { CreateAccountInput, LoginInput } from "../types/user.type";

export const createAccount = async (req: Request, res: Response) => {
  const { username, email, password } = req.body as CreateAccountInput;
  console.log(username);
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      res.status(400).json({ message: "Username or email already exists" });
    }
    console.log(username);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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
    console.log(process.env.PORT);
    res.status(200).json({ message: "Login successful", userId: "user._id" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
