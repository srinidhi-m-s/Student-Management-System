import { Request, Response } from "express";
import { Attendance } from "../models/Attendance.js";
import { Student } from "../models/Student.js";

// Helper to check if faculty has access to student
const facultyHasAccess = async (facultyUserId: string, studentId: string): Promise<boolean> => {
  console.log("facultyHasAccess called with:", { facultyUserId, studentId });
  
  const student = await Student.findById(studentId);
  console.log("Found student:", student ? { 
    _id: student._id?.toString(), 
    facultyId: student.facultyId?.toString() 
  } : null);
  
  if (!student) {
    console.log("Student not found!");
    return false;
  }
  
  // Compare as strings - both could be ObjectId or string
  const studentFacultyId = student.facultyId?.toString();
  const requestingFacultyId = facultyUserId?.toString();
  
  console.log("Comparing:", { studentFacultyId, requestingFacultyId, match: studentFacultyId === requestingFacultyId });
  
  return studentFacultyId === requestingFacultyId;
};

// Get all attendance records for students assigned to the faculty
export const getAttendanceByFaculty = async (req: Request, res: Response) => {
  try {
    const facultyUserId = (req as any).user.id;
    
    // Find all students assigned to this faculty
    const students = await Student.find({ facultyId: facultyUserId });
    const studentIds = students.map(s => s._id);
    
    const attendance = await Attendance.find({ studentId: { $in: studentIds } })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" }
      })
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch attendance records" });
  }
};

// Get attendance for a specific student
export const getStudentAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const user = (req as any).user;
    
    // If faculty, check if they have access to this student
    if (user.role === "faculty") {
      const hasAccess = await facultyHasAccess(user.id, studentId);
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have access to this student" });
      }
    }
    
    const attendance = await Attendance.find({ studentId })
      .populate({
        path: "studentId",
        populate: { path: "userId", select: "name email" }
      })
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch student attendance" });
  }
};

// Mark attendance for a student (faculty only for their assigned students)
export const markAttendance = async (req: Request, res: Response) => {
  try {
    const { studentId, date, status, remarks } = req.body;
    const facultyUserId = (req as any).user.id;
    
    console.log("Mark attendance request:", { studentId, facultyUserId, date, status });
    
    // Check if faculty has access to this student
    const hasAccess = await facultyHasAccess(facultyUserId, studentId);
    console.log("Faculty has access:", hasAccess);
    
    if (!hasAccess) {
      return res.status(403).json({ 
        message: "You don't have access to this student",
        debug: { facultyUserId, studentId }
      });
    }
    
    // Normalize date to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Check if attendance already exists for this date
    const existingAttendance = await Attendance.findOne({
      studentId,
      date: attendanceDate
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: "Attendance already marked for this date" });
    }
    
    const attendance = new Attendance({
      studentId,
      facultyId: facultyUserId,
      date: attendanceDate,
      status,
      remarks
    });
    
    await attendance.save();
    
    // Update student's attendance percentage
    await updateAttendancePercentage(studentId);
    
    const populatedAttendance = await attendance.populate({
      path: "studentId",
      populate: { path: "userId", select: "name email" }
    });
    
    res.status(201).json(populatedAttendance);
  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({ message: "Failed to mark attendance" });
  }
};

// Bulk mark attendance for multiple students
export const markBulkAttendance = async (req: Request, res: Response) => {
  try {
    const { attendanceRecords, date } = req.body;
    const facultyUserId = (req as any).user.id;
    
    // Validate all students belong to this faculty
    for (const record of attendanceRecords) {
      const hasAccess = await facultyHasAccess(facultyUserId, record.studentId);
      if (!hasAccess) {
        return res.status(403).json({ 
          message: `You don't have access to student ${record.studentId}` 
        });
      }
    }
    
    const results = [];
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    for (const record of attendanceRecords) {
      // Skip if attendance already exists
      const existing = await Attendance.findOne({
        studentId: record.studentId,
        date: attendanceDate
      });
      
      if (!existing) {
        const attendance = new Attendance({
          studentId: record.studentId,
          facultyId: facultyUserId,
          date: attendanceDate,
          status: record.status,
          remarks: record.remarks || ""
        });
        await attendance.save();
        results.push(attendance);
        
        // Update attendance percentage for this student
        await updateAttendancePercentage(record.studentId);
      }
    }
    
    res.status(201).json({ 
      message: `${results.length} attendance records created`,
      records: results 
    });
  } catch (error) {
    console.error("Bulk attendance error:", error);
    res.status(500).json({ message: "Failed to mark bulk attendance" });
  }
};

// Update attendance record
export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const facultyUserId = (req as any).user.id;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    
    // Check if faculty has access
    const hasAccess = await facultyHasAccess(facultyUserId, attendance.studentId.toString());
    if (!hasAccess) {
      return res.status(403).json({ message: "You don't have access to this record" });
    }
    
    attendance.status = status || attendance.status;
    attendance.remarks = remarks !== undefined ? remarks : attendance.remarks;
    await attendance.save();
    
    // Update student's attendance percentage
    await updateAttendancePercentage(attendance.studentId.toString());
    
    const populatedAttendance = await attendance.populate({
      path: "studentId",
      populate: { path: "userId", select: "name email" }
    });
    
    res.json(populatedAttendance);
  } catch (error) {
    res.status(500).json({ message: "Failed to update attendance" });
  }
};

// Delete attendance record
export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    
    // Faculty can only delete their own records, admin can delete any
    if (user.role === "faculty") {
      const hasAccess = await facultyHasAccess(user.id, attendance.studentId.toString());
      if (!hasAccess) {
        return res.status(403).json({ message: "You don't have access to this record" });
      }
    }
    
    const studentId = attendance.studentId.toString();
    await Attendance.findByIdAndDelete(id);
    
    // Update student's attendance percentage
    await updateAttendancePercentage(studentId);
    
    res.json({ message: "Attendance record deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete attendance" });
  }
};

// Helper function to update student's attendance percentage
const updateAttendancePercentage = async (studentId: string) => {
  const attendanceRecords = await Attendance.find({ studentId });
  
  if (attendanceRecords.length === 0) {
    await Student.findByIdAndUpdate(studentId, { attendancePercentage: 0 });
    return;
  }
  
  const presentCount = attendanceRecords.filter(
    a => a.status === "present" || a.status === "late"
  ).length;
  
  const percentage = Math.round((presentCount / attendanceRecords.length) * 100);
  await Student.findByIdAndUpdate(studentId, { attendancePercentage: percentage });
};

// Get all faculty members (for admin to assign students)
export const getFacultyList = async (req: Request, res: Response) => {
  try {
    const { User } = await import("../models/User.js");
    const faculty = await User.find({ role: "faculty" }).select("_id name email");
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch faculty list" });
  }
};
