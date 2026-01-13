import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/course.controller.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Get all courses (all authenticated users can view)
router.get("/", getAllCourses);

// Get course by ID
router.get("/:id", getCourseById);

// Create course (Admin only - checked in controller)
router.post("/", createCourse);

// Update course (Admin only - checked in controller)
router.put("/:id", updateCourse);

// Delete course (Admin only - checked in controller)
router.delete("/:id", deleteCourse);

export default router;
