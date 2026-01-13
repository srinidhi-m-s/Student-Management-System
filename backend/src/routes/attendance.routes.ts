import { Router } from "express";
import { 
  getAttendanceByFaculty, 
  getStudentAttendance, 
  markAttendance, 
  markBulkAttendance,
  updateAttendance, 
  deleteAttendance,
  getFacultyList
} from "../controllers/attendance.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { requireRole } from "../middlewares/roleAuth.js";

const router = Router();

// Get faculty list (admin only - for assigning students)
router.get("/faculty-list", requireAuth, requireRole("admin"), getFacultyList);

// Get all attendance records for faculty's students
router.get("/", requireAuth, requireRole("faculty", "admin"), getAttendanceByFaculty);

// Get attendance for a specific student
router.get("/student/:studentId", requireAuth, requireRole("faculty", "admin"), getStudentAttendance);

// Mark attendance for a single student
router.post("/", requireAuth, requireRole("faculty"), markAttendance);

// Bulk mark attendance for multiple students
router.post("/bulk", requireAuth, requireRole("faculty"), markBulkAttendance);

// Update attendance record
router.put("/:id", requireAuth, requireRole("faculty", "admin"), updateAttendance);

// Delete attendance record
router.delete("/:id", requireAuth, requireRole("faculty", "admin"), deleteAttendance);

export default router;
