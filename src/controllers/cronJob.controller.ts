import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandler";
import { success } from "../utils/ApiResponse";
import { badRequest } from "../utils/ApiError";

export const sendPingRequest = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      return res
        .status(200)
        .send(success("Ping request successful", "response.data"));
    } catch (error: any) {
      return res
        .status(400)
        .send(badRequest("Ping request failed", error.message));
    }
  }
);
