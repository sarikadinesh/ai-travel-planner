import mongoose from "mongoose";

const ROLES = ["traveler", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ROLES,
      default: "traveler",
    },
    disabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export const User = mongoose.model("User", userSchema);
export { ROLES };
