import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { Request } from "express";

interface customReq extends Request {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
}

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as { _id: string; email: string };

    const user = await User.findById(decodedToken._id).select(
      "-password   -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    (req as customReq).user = user;
    next();
  } catch (error: any) {
    throw new ApiError(401, error.message || "Invalid access token");
  }
});

export { verifyJWT };
