import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Student } from '../models/Student.js';
import bcrypt from 'bcrypt';

export const getAllFaculty = async (req: Request, res: Response) => {
  try {
    const facultyList = await User.find({ role: 'faculty' }, '-password');
    res.json(facultyList);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
};

export const getFacultyStudentCount = async (req: Request, res: Response) => {
  try {
    const count = await Student.countDocuments({ facultyId: req.params.id });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get student count' });
  }
};

export const addFaculty = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const faculty = new User({ name, email, password: hashedPassword, role: 'faculty' });
    await faculty.save();
    res.status(201).json({ message: 'Faculty created', faculty: { _id: faculty._id, name, email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add faculty' });
  }
};

export const updateFaculty = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const update: Record<string, string> = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }
    const faculty = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'faculty' },
      { $set: update },
      { new: true }
    );
    if (!faculty) {
      res.status(404).json({ error: 'Faculty not found' });
      return;
    }
    res.json({ message: 'Faculty updated', faculty: { _id: faculty._id, name: faculty.name, email: faculty.email } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update faculty' });
  }
};

export const deleteFaculty = async (req: Request, res: Response) => {
  try {
    const { reassignTo } = req.body;
    const facultyId = req.params.id;

    const faculty = await User.findOne({ _id: facultyId, role: 'faculty' });
    if (!faculty) {
      res.status(404).json({ error: 'Faculty not found' });
      return;
    }

    const studentCount = await Student.countDocuments({ facultyId });
    if (studentCount > 0) {
      if (!reassignTo) {
        res.status(400).json({ 
          error: 'Reassignment required', 
          studentCount,
          message: `This faculty has ${studentCount} student(s). Please select another faculty to reassign them to.`
        });
        return;
      }

      const targetFaculty = await User.findOne({ _id: reassignTo, role: 'faculty' });
      if (!targetFaculty) {
        res.status(400).json({ error: 'Target faculty for reassignment not found' });
        return;
      }
      await Student.updateMany(
        { facultyId },
        { $set: { facultyId: reassignTo } }
      );
    }
    
    await User.findByIdAndDelete(facultyId);    
    res.json({ 
      message: 'Faculty deleted', 
      studentsReassigned: studentCount 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
};
