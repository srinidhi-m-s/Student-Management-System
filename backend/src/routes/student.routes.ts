import { Router } from "express";
import { getStudents, createStudent, updateStudent, deleteStudent, getStudentById, getStudentByUserId, getFacultyList } from "../controllers/student.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roleAuth.js";

const router = Router();

// Get faculty list for admin to assign students
router.get("/faculty-list", requireAuth, requireRole("admin"), getFacultyList);
// Admin gets all students, Faculty gets only their assigned students
router.get("/", requireAuth, requireRole("admin", "faculty"), getStudents);
router.get("/me", requireAuth, getStudentByUserId);
router.get("/:id", requireAuth, requireRole("admin", "faculty"), getStudentById);
router.post("/", requireAuth, requireRole("admin"), createStudent);
router.delete("/:id", requireAuth, requireRole("admin"), deleteStudent);
router.put("/:id", requireAuth, requireRole("admin", "faculty"), updateStudent);

export default router;
