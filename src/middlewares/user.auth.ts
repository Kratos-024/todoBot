import { checkAuthAi } from "../controllers/AiChat.controller";
import { User } from "../models/user.model";
import { badRequest, unauthorized } from "../utils/ApiError";
import { success } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/AsyncHandler";
import { NextFunction, Request, Response } from "express";

export const userAuth = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { whatsappNumber } = req.body;

    if (!whatsappNumber) {
      return res.status(400).json(badRequest("Whatsapp number is required"));
    }

    const user = await User.findOne({ whatsappNumber });

    if (!user) {
      return res
        .status(401)
        .json(unauthorized("You are not registered", "You are not registered"));
    }

    next();
  }
);

export const handleAuthOrCreate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { getQuestion, whatsappNumber } = req.body;
    try {
      const user = await User.findOne({ whatsappNumber });
      if (!user) {
        console.log("dkfadklfkl4344343f");

        const response = await checkAuthAi(getQuestion, whatsappNumber);
        res.send(success("Account created successfully", response));
        return;
      }

      next();
    } catch (error) {
      return res.status(500).json(badRequest("Internal error", error));
    }
  }
);
