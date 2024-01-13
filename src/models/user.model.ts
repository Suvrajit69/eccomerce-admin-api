import mongoose, { Schema, Document} from "mongoose";
import jwt from "jsonwebtoken";

import bcrypt from "bcrypt";

interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  password?: string;
  refreshToken?: string;
  generateAccessToken: ()=> string;
  generateRefreshToken: ()=> string;
  isPasswordCorrect: (password: string)=> boolean;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    password: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password as string, 10)
  next();
})

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken =  function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET as string, 
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY as string,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};


export const User = mongoose.model<IUser>("User", userSchema);