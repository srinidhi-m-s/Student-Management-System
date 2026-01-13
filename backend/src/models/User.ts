import mongoose, { Schema, Document } from "mongoose";

export interface UserDoc extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "faculty" | "student";
  createdAt: Date;
}

const userSchema = new Schema<UserDoc>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "faculty", "student"], default: "student" },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<UserDoc>("User", userSchema);
