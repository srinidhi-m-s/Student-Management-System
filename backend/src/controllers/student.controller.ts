import { Request, Response } from "express";
import { Student } from "../models/Student.js";
import { User } from "../models/User.js";
import { Course } from "../models/Course.js";
import bcrypt from "bcrypt";

const formatStudent = (student: any) => ({
  id: student._id,
  userId: student.userId,
  courseId: student.courseId,
  facultyId: student.facultyId,
  overallGrade: student.overallGrade,
  marks: student.marks,
  attendancePercentage: student.attendancePercentage,
  createdAt: student.createdAt,
});

export const getStudents = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let query = {};
    
    // If faculty, only return students assigned to them
    if (user.role === "faculty") {
      query = { facultyId: user.id };
    }
    
    const students = await Student.find(query)
      .populate("userId", "name email role")
      .populate("courseId", "name subjects")
      .populate("facultyId", "name email");
    res.json(students.map(formatStudent));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const student = await Student.findById(req.params.id)
      .populate("userId", "name email role")
      .populate("courseId", "name subjects")
      .populate("facultyId", "name email");
    
    if (!student) return res.status(404).json({ message: "Student not found" });
    
    // Faculty can only access their assigned students
    if (user.role === "faculty" && student.facultyId.toString() !== user.id) {
      return res.status(403).json({ message: "You don't have access to this student" });
    }
    
    res.json(formatStudent(student));
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student" });
  }
};

export const getStudentByUserId = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const student = await Student.findOne({ userId })
      .populate("userId", "name email role")
      .populate("courseId", "name subjects")
      .populate("facultyId", "name email");
    
    if (!student) {
      return res.status(404).json({ message: "Student record not found" });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student" });
  }
};

const DEFAULT_PASSWORD = "1234";

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { userId, courseId, facultyId, overallGrade, marks, attendancePercentage, email, name } = req.body;

    if (!courseId) {
      return res.status(400).json({ message: "Course is required" });
    }

    if (!facultyId) {
      return res.status(400).json({ message: "Faculty ID is required" });
    }

    // Verify courseId is valid
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(400).json({ message: "Invalid course ID. Course not found." });
    }

    // Verify facultyId is a valid faculty user
    const facultyUser = await User.findById(facultyId);
    if (!facultyUser || facultyUser.role !== "faculty") {
      return res.status(400).json({ message: "Invalid faculty ID. User must have faculty role." });
    }

    let studentUserId = userId;
    
    // If userId is not provided, create a new User first
    if (!userId) {
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required when userId is not provided" });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
      const user = new User({ 
        email, 
        name, 
        password: hashedPassword, 
        role: "student" 
      });
      await user.save();
      studentUserId = user._id;
    }

    const student = new Student({ 
      userId: studentUserId, 
      courseId,
      facultyId,
      overallGrade: overallGrade || "", 
      marks: marks || 0,
      attendancePercentage: attendancePercentage || 0 
    });
    await student.save();
    const populatedStudent = await student.populate([
      { path: "userId", select: "name email role" },
      { path: "courseId", select: "name subjects" },
      { path: "facultyId", select: "name email" }
    ]);
    res.status(201).json(formatStudent(populatedStudent as any));
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ message: "Failed to create student", error: error instanceof Error ? error.message : "" });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const studentId = req.params.id;
    
    // Check if faculty has access
    if (user.role === "faculty") {
      const existingStudent = await Student.findById(studentId);
      if (!existingStudent || existingStudent.facultyId.toString() !== user.id) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
    }
    
    // If updating courseId, verify the new course is valid
    if (req.body.courseId) {
      const course = await Course.findById(req.body.courseId);
      if (!course) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
    }
    
    // If updating facultyId, verify the new faculty is valid
    if (req.body.facultyId) {
      const facultyUser = await User.findById(req.body.facultyId);
      if (!facultyUser || facultyUser.role !== "faculty") {
        return res.status(400).json({ message: "Invalid faculty ID" });
      }
    }
    
    const student = await Student.findByIdAndUpdate(studentId, req.body, { new: true })
      .populate("userId", "name email role")
      .populate("courseId", "name subjects")
      .populate("facultyId", "name email");
    
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(formatStudent(student as any));
  } catch (error) {
    res.status(500).json({ message: "Failed to update student" });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    await User.findByIdAndDelete(student.userId);
    
    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ message: "Student deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete student" });
  }
};

export const getFacultyList = async (req: Request, res: Response) => {
  try {
    const faculty = await User.find({ role: "faculty" })
      .select("name email")
      .sort({ name: 1 });
    
    const formattedFaculty = faculty.map(f => ({
      id: f._id,
      name: f.name,
      email: f.email
    }));
    
    res.json(formattedFaculty);
  } catch (error) {
    console.error("Error fetching faculty list:", error);
    res.status(500).json({ message: "Failed to fetch faculty list" });
  }
};
