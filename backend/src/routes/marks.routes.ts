import express from "express";
import { 
  getAllMarks, 
  getMarksByStudent, 
  addMarks, 
  updateMarks, 
  deleteMarks 
} from "../controllers/marks.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roleAuth.js";

const router = express.Router();

router.use(requireAuth);

// Get all marks (Admin sees all, Faculty sees marks they created, Students see their own)
router.get("/", getAllMarks);

// Get marks by student ID
router.get("/student/:studentId", getMarksByStudent);

// Add marks (Faculty only - admin is view-only)
router.post("/", requireRole("faculty"), addMarks);

// Update marks (Faculty only - admin is view-only)
router.put("/:id", requireRole("faculty"), updateMarks);

// Delete marks (Faculty only - admin is view-only)
router.delete("/:id", requireRole("faculty"), deleteMarks);

export default router;
