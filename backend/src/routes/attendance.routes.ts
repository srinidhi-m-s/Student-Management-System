import { Router } from "express";
import { 
  getAttendanceByFaculty, 
  getStudentAttendance, 
  markAttendance, 
  updateAttendance, 
  deleteAttendance,
  getFacultyList
} from "../controllers/attendance.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roleAuth.js";

const router = Router();

// Get faculty list (admin only - for assigning students)
router.get("/faculty-list", requireAuth, requireRole("admin"), getFacultyList);

// Get all attendance records for faculty's students, admin's all students, or student's own attendance
router.get("/", requireAuth, requireRole("faculty", "admin", "student"), getAttendanceByFaculty);

// Get attendance for a specific student
router.get("/student/:studentId", requireAuth, requireRole("faculty", "admin"), getStudentAttendance);

// Mark attendance for a single student
router.post("/", requireAuth, requireRole("faculty"), markAttendance);

// Update attendance record
router.put("/:id", requireAuth, requireRole("faculty", "admin"), updateAttendance);

// Delete attendance record
router.delete("/:id", requireAuth, requireRole("faculty", "admin"), deleteAttendance);

export default router;
