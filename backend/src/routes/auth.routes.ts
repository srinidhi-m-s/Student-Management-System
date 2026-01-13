import { Router } from "express";
import { login, verify, register } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/verify", requireAuth, verify);

export default router;
