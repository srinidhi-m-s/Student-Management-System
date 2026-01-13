import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roleAuth.js';
import {
  getAllFaculty,
  addFaculty,
  updateFaculty,
  deleteFaculty
} from '../controllers/faculty.controller.js';

const router = express.Router();

// Get all faculty
router.get('/', requireAuth, requireRole('admin'), getAllFaculty);

// Add new faculty
router.post('/', requireAuth, requireRole('admin'), addFaculty);

// Update faculty
router.put('/:id', requireAuth, requireRole('admin'), updateFaculty);
// Delete faculty
router.delete('/:id', requireAuth, requireRole('admin'), deleteFaculty);

export default router;
