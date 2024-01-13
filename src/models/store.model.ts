import mongoose, { Schema } from "mongoose";

const storeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const Store = mongoose.model("User", storeSchema);
