import { Router } from "express";
import { login, verify, register, changePassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/verify", requireAuth, verify);
router.post("/change-password", requireAuth, changePassword);

export default router;
