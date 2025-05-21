import { Request, Response } from "express";
<<<<<<< HEAD
=======
import axios from "axios";
>>>>>>> fac9867b9a9ae0041a1b843a191a760d61c6dcb7
import { asyncHandler } from "../utils/AsyncHandler";
import { success } from "../utils/ApiResponse";
import { badRequest } from "../utils/ApiError";

<<<<<<< HEAD
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
=======
export const sendPingRequest = asyncHandler(async (_req: Request, res: Response) => {
  try {
    
    return res.status(200).send(success("Ping request successful", "response.data"));
  } catch (error: any) {
    return res.status(400).send(badRequest("Ping request failed", error.message));
  }
});
>>>>>>> fac9867b9a9ae0041a1b843a191a760d61c6dcb7
