import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleAuth.js';
import {
  getAllFaculty,
  addFaculty,
  updateFaculty,
  deleteFaculty,
  getFacultyStudentCount
} from '../controllers/faculty.controller.js';

const router = express.Router();

router.get('/', requireAuth, requireRole('admin'), getAllFaculty);


router.get('/:id/student-count', requireAuth, requireRole('admin'), getFacultyStudentCount);

// Add new faculty
router.post('/', requireAuth, requireRole('admin'), addFaculty);

// Update faculty
router.put('/:id', requireAuth, requireRole('admin'), updateFaculty);
// Delete faculty (with reassignment)
router.delete('/:id', requireAuth, requireRole('admin'), deleteFaculty);

export default router;
