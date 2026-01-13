import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export const generateToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
};

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);  // ← Must match generateToken's secret
  } catch (err) {
    return null;
  }
}