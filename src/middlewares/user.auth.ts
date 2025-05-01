import { User } from "../models/user.model";
import { badRequest, unauthorized } from "../utils/ApiError";
import { asyncHandler } from "../utils/AsyncHandler";
import { NextFunction, Request, Response } from "express";

export const userAuth = asyncHandler(
  async (req: Request, res: Response, nextFunc: NextFunction) => {
    const { whatsappNumber } = req.body;

    if (!whatsappNumber) {
      res.status(400).json(badRequest("Whatsapp number is required"));
      return;
    }

    const user = await User.findOne({ whatsappNumber });

    if (!user) {
      res.send(
        unauthorized("You are not registered", "You are not registered")
      );
      return;
    }

    nextFunc();
  }
);
