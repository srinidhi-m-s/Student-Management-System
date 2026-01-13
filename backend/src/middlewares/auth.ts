import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: Missing or invalid token" });
  }
  
  const token = auth.split(" ")[1];
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
  
  (req as any).user = payload;
  next();
};