import { Request, Response } from "express";
import { Course } from "../models/Course.js";

// Get all courses
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find().sort({ name: 1 });
    res.json(courses);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ message: "Failed to fetch courses" });
  }
};

// Get course by ID
export const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ message: "Failed to fetch course" });
  }
};

// Create new course (Admin only)
export const createCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create courses" });
    }

    const { name, subjects } = req.body;

    if (!name || !subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ 
        message: "Course name and at least one subject are required" 
      });
    }

    // Check if course with same name already exists
    const existingCourse = await Course.findOne({ name: name.trim() });
    if (existingCourse) {
      return res.status(400).json({ message: "Course with this name already exists" });
    }

    const course = new Course({
      name: name.trim(),
      subjects: subjects.map((s: string) => s.trim()).filter((s: string) => s),
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ message: "Failed to create course" });
  }
};

// Update course (Admin only)
export const updateCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can update courses" });
    }

    const { name, subjects } = req.body;
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if new name conflicts with another course
    if (name && name !== course.name) {
      const existingCourse = await Course.findOne({ name: name.trim() });
      if (existingCourse) {
        return res.status(400).json({ message: "Course with this name already exists" });
      }
      course.name = name.trim();
    }

    if (subjects && Array.isArray(subjects) && subjects.length > 0) {
      course.subjects = subjects.map((s: string) => s.trim()).filter((s: string) => s);
    }

    await course.save();
    res.json(course);
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ message: "Failed to update course" });
  }
};

// Delete course (Admin only)
export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can delete courses" });
    }

    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ message: "Failed to delete course" });
  }
};
