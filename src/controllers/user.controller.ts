import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
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

const generateAccessAndRefreshTokens = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(
        500,
        "Somethis went wrong while generating refresh and access token"
      );
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Somethis went wrong while generating refresh and access token"
    );
  }
};

const options = {
  httpOnly: true,
  secure: true,
};

const signUpJwt = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exist: email
  // check first name, last name and password
  // create user object - create entry in db
  // remove password and refresh token field
  // check for user creation
  // return response

  const { firstName, lastName, email, password } = req.body;

  if (
    [firstName, lastName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({ email: email });

  if (existingUser) {
    throw new ApiError(409, "user with this email already exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
  });

  if (!user) {
    throw new ApiError(500, "Something went wrong while creating the user");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const signedUpUser = await User.findByIdAndUpdate(user._id, {
    $set: {
      refreshToken: refreshToken,
    },
  }).select("-password -refreshToken");

  if (!signedUpUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: signedUpUser, accessToken, refreshToken },
        "User signed up successfully"
      )
    );
});

const signInJwt = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password required");
  }
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new ApiError(400, "user not exist please try to sign up");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const signInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: signInUser,
          accessToken,
          refreshToken,
        },
        "User signed in successflly"
      )
    );
});

const signOutJwt = asyncHandler(async(req, res)=>{
 
  await User.findByIdAndUpdate(
    (req as customReq).user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
})

export { signUpJwt, signInJwt, signOutJwt };
