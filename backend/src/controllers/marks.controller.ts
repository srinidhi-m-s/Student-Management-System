import { Request, Response } from "express";
import { Marks } from "../models/Marks.js";
import { Student } from "../models/Student.js";

// Helper function to calculate overall marks and grade for a student
const calculateStudentOverallMarks = async (studentId: string) => {
  try {
    const marks = await Marks.find({ studentId });
    
    if (marks.length === 0) {
      return { averageMarks: 0, overallGrade: "N/A" };
    }
    
    // Calculate average percentage
    const totalPercentage = marks.reduce((sum, mark) => sum + mark.percentage, 0);
    const averagePercentage = totalPercentage / marks.length;
    
    // Calculate overall grade based on average percentage
    let overallGrade = "F";
    if (averagePercentage >= 90) overallGrade = "A+";
    else if (averagePercentage >= 85) overallGrade = "A";
    else if (averagePercentage >= 80) overallGrade = "A-";
    else if (averagePercentage >= 75) overallGrade = "B+";
    else if (averagePercentage >= 70) overallGrade = "B";
    else if (averagePercentage >= 65) overallGrade = "B-";
    else if (averagePercentage >= 60) overallGrade = "C+";
    else if (averagePercentage >= 55) overallGrade = "C";
    else if (averagePercentage >= 50) overallGrade = "C-";
    else if (averagePercentage >= 40) overallGrade = "D";
    
    return { averageMarks: Math.round(averagePercentage), overallGrade };
  } catch (error) {
    console.error("Error calculating student overall marks:", error);
    return { averageMarks: 0, overallGrade: "N/A" };
  }
};

export const getAllMarks = async (req: Request, res: Response) => {
  try {
    const user: any = (req as any).user;
    let query = {};

    // If student, restrict to their own marks
    if (user.role === 'student') {
      // Find the studentId for this user (user.id from JWT token)
      const student = await Student.findOne({ userId: user.id });
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      query = { studentId: student._id };
    } else if (user.role === "faculty") {
      // Find all students assigned to this faculty
      const assignedStudents = await Student.find({ facultyId: user.id }).select('_id');
      const assignedStudentIds = assignedStudents.map(s => s._id);
      query = { studentId: { $in: assignedStudentIds } };
    }

    const marks = await Marks.find(query)
      .populate({
        path: "studentId",
        populate: [
          {
            path: "userId",
            select: "name email",
          },
          {
            path: "courseId",
            select: "name subjects"
          }
        ],
      })
      .populate("createdBy", "name email")
      .sort({ examDate: -1 });

    res.json(marks);
  } catch (error) {
    console.error("Get marks error:", error);
    res.status(500).json({ message: "Failed to fetch marks" });
  }
};

export const getMarksByStudent = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;
    const { subject, examType } = req.query;

    let query: any = { studentId };

    if (user.role === "faculty") {
      // Only allow faculty to view marks for students assigned to them
      const student = await Student.findById(studentId);
      if (!student || student.facultyId.toString() !== user.id) {
        return res.status(403).json({ message: "You are not assigned to this student" });
      }
    }

    if (subject) {
      query.subject = subject;
    }

    if (examType) {
      query.examType = examType;
    }

    const marks = await Marks.find(query)
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate("createdBy", "name email")
      .sort({ examDate: -1 });

    res.json(marks);
  } catch (error) {
    console.error("Get student marks error:", error);
    res.status(500).json({ message: "Failed to fetch student marks" });
  }
};

export const addMarks = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    
    if (user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can add marks" });
    }

    const {
      studentId,
      subject,
      examType,
      maxMarks,
      marksObtained,
      examDate,
    } = req.body;

    if (!studentId || !subject || !examType || !maxMarks || marksObtained === undefined || !examDate) {
      return res.status(400).json({
        message: "Student ID, subject, exam type, max marks, marks obtained, and exam date are required",
      });
    }

    if (marksObtained > maxMarks) {
      return res.status(400).json({
        message: "Marks obtained cannot be greater than maximum marks",
      });
    }

    const normalizedExamType = examType.toLowerCase().replace('-', ''); // "Mid-term" -> "midterm"
    const validExamTypes = ["assignment", "quiz", "midterm", "final", "project"];
    
    if (!validExamTypes.includes(normalizedExamType)) {
      return res.status(400).json({
        message: `Invalid exam type. Valid types are: ${validExamTypes.join(', ')}`
      });
    }


    const percentage = Math.round((Number(marksObtained) / Number(maxMarks)) * 100);

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const marks = new Marks({
      studentId,
      subject,
      examType: normalizedExamType,
      maxMarks: Number(maxMarks),
      marksObtained: Number(marksObtained),
      percentage,
      examDate: new Date(examDate),
      createdBy: user.id,
    });

    await marks.save();

    // Update student's overall marks and grade
    const { averageMarks, overallGrade } = await calculateStudentOverallMarks(studentId);
    await Student.findByIdAndUpdate(studentId, {
      marks: averageMarks,
      overallGrade: overallGrade
    });

    const populatedMarks = await Marks.findById(marks._id)
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate("createdBy", "name email");

    res.status(201).json(populatedMarks);
  } catch (error) {
    console.error("Add marks error:", error);
    res.status(500).json({ message: "Failed to add marks" });
  }
};


export const updateMarks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can update marks" });
    }

    const marks = await Marks.findById(id);
    if (!marks) {
      return res.status(404).json({ message: "Marks record not found" });
    }

    // Allow update if the faculty is assigned to the student
    const student = await Student.findById(marks.studentId);
    if (!student || student.facultyId.toString() !== user.id) {
      return res.status(403).json({ message: "You are not assigned to this student" });
    }

    const {
      subject,
      examType,
      maxMarks,
      marksObtained,
      examDate,
    } = req.body;

    if (marksObtained !== undefined && maxMarks && marksObtained > maxMarks) {
      return res.status(400).json({
        message: "Marks obtained cannot be greater than maximum marks",
      });
    }

    if (subject) marks.subject = subject;
    if (examType) marks.examType = examType;
    if (maxMarks) marks.maxMarks = maxMarks;
    if (marksObtained !== undefined) marks.marksObtained = marksObtained;
    if (examDate) marks.examDate = new Date(examDate);
    // remarks field removed

    if (maxMarks && marksObtained !== undefined) {
      marks.percentage = Math.round((marksObtained / maxMarks) * 100);
    } else if (maxMarks && marks.marksObtained) {
      marks.percentage = Math.round((marks.marksObtained / maxMarks) * 100);
    } else if (marksObtained !== undefined && marks.maxMarks) {
      marks.percentage = Math.round((marksObtained / marks.maxMarks) * 100);
    }

    await marks.save();

    // Update student's overall marks and grade
    const { averageMarks, overallGrade } = await calculateStudentOverallMarks(marks.studentId.toString());
    await Student.findByIdAndUpdate(marks.studentId, {
      marks: averageMarks,
      overallGrade: overallGrade
    });

    const populatedMarks = await Marks.findById(marks._id)
      .populate({
        path: "studentId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate("createdBy", "name email");

    res.json(populatedMarks);
  } catch (error) {
    console.error("Update marks error:", error);
    res.status(500).json({ message: "Failed to update marks" });
  }
};


export const deleteMarks = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    
    if (user.role !== "faculty") {
      return res.status(403).json({ message: "Only faculty can delete marks" });
    }

    const marksToDelete = await Marks.findById(id);
    if (!marksToDelete) {
      return res.status(404).json({ message: "Marks record not found" });
    }

    
    if (marksToDelete.createdBy.toString() !== user.id) {
      return res.status(403).json({ message: "You can only delete marks you created" });
    }

    const studentId = marksToDelete.studentId;
    await Marks.findByIdAndDelete(id);

    // Update student's overall marks and grade after deletion
    const { averageMarks, overallGrade } = await calculateStudentOverallMarks(studentId.toString());
    await Student.findByIdAndUpdate(studentId, {
      marks: averageMarks,
      overallGrade: overallGrade
    });

    res.json({ message: "Marks record deleted successfully" });
  } catch (error) {
    console.error("Delete marks error:", error);
    res.status(500).json({ message: "Failed to delete marks record" });
  }
};
